import { useState, useCallback, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";
import type { PeerConnection } from "../types/video.types";

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  socket: Socket;
  iceServers: RTCIceServer[];
}

export const useWebRTC = (options: UseWebRTCOptions) => {
  const { roomId, userId, socket, iceServers } = options;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Map<string, PeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Update refs when state changes
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Get local media stream (camera/mic)
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get media devices";
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(
    (peerId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers });

      // Add local stream to connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming stream
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          setRemoteStreams((prev) => new Map(prev.set(peerId, remoteStream)));
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            to: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        // Check if all peer connections are in connected state
        const checkAllConnections = () => {
          const allPeers = Array.from(peersRef.current.values());
          if (allPeers.length === 0) {
            setIsConnected(false);
            return;
          }
          const allConnected = allPeers.every(
            (p) => p.connection.connectionState === "connected",
          );
          setIsConnected(allConnected);
        };

        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          console.warn(
            `Connection ${pc.connectionState} with ${peerId}, may need reconnection`,
          );
          checkAllConnections();
        } else if (pc.connectionState === "connected") {
          checkAllConnections();
        }
      };

      return pc;
    },
    [roomId, socket, iceServers],
  );

  // Handle offer from peer
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit, from: string) => {
      const stream = localStreamRef.current;
      if (!stream) return;

      const pc = createPeerConnection(from, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { roomId, to: from, answer });

      setPeers(
        (prev) => new Map(prev.set(from, { peerId: from, connection: pc })),
      );
    },
    [roomId, socket, createPeerConnection],
  );

  // Handle answer from peer
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit, from: string) => {
      const peer = peersRef.current.get(from);
      if (peer) {
        await peer.connection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      }
    },
    [],
  );

  // Handle ICE candidate from peer
  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit, from: string) => {
      const peer = peersRef.current.get(from);
      if (peer) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    },
    [],
  );

  // Set up socket event listeners once
  useEffect(() => {
    // Listen for new peers
    const handleUserJoined = async ({
      userId: newUserId,
    }: {
      userId: string;
    }) => {
      if (newUserId === userId || !localStreamRef.current) return;

      // Create offer for new user
      const pc = createPeerConnection(newUserId, localStreamRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("offer", { roomId, to: newUserId, offer });

      setPeers(
        (prev) =>
          new Map(prev.set(newUserId, { peerId: newUserId, connection: pc })),
      );
    };

    // Listen for existing users
    const handleExistingUsers = async ({ users }: { users: string[] }) => {
      if (!localStreamRef.current) return;

      for (const existingUserId of users) {
        const pc = createPeerConnection(existingUserId, localStreamRef.current);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("offer", { roomId, to: existingUserId, offer });

        setPeers(
          (prev) =>
            new Map(
              prev.set(existingUserId, {
                peerId: existingUserId,
                connection: pc,
              }),
            ),
        );
      }
    };

    // Listen for signaling events
    const handleOfferReceived = ({
      offer,
      from,
    }: {
      offer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      handleOffer(offer, from);
    };

    const handleAnswerReceived = ({
      answer,
      from,
    }: {
      answer: RTCSessionDescriptionInit;
      from: string;
    }) => {
      handleAnswer(answer, from);
    };

    const handleIceCandidateReceived = ({
      candidate,
      from,
    }: {
      candidate: RTCIceCandidateInit;
      from: string;
    }) => {
      handleIceCandidate(candidate, from);
    };

    // Handle user leaving
    const handleUserLeft = ({ userId: leftUserId }: { userId: string }) => {
      const peer = peersRef.current.get(leftUserId);
      if (peer) {
        peer.connection.close();
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.delete(leftUserId);
          return newPeers;
        });
        setRemoteStreams((prev) => {
          const newStreams = new Map(prev);
          newStreams.delete(leftUserId);
          return newStreams;
        });
      }
    };

    // Register event listeners
    socket.on("user-joined", handleUserJoined);
    socket.on("existing-users", handleExistingUsers);
    socket.on("offer", handleOfferReceived);
    socket.on("answer", handleAnswerReceived);
    socket.on("ice-candidate", handleIceCandidateReceived);
    socket.on("user-left", handleUserLeft);

    // Cleanup listeners on unmount or when dependencies change
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("existing-users", handleExistingUsers);
      socket.off("offer", handleOfferReceived);
      socket.off("answer", handleAnswerReceived);
      socket.off("ice-candidate", handleIceCandidateReceived);
      socket.off("user-left", handleUserLeft);
    };
  }, [
    roomId,
    userId,
    socket,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  // Join room and initiate connections
  const joinRoom = useCallback(async () => {
    try {
      await initializeMedia();
      socket.emit("join-video-room", { roomId, userId });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join room";
      setError(errorMessage);
      throw err;
    }
  }, [roomId, userId, socket, initializeMedia]);

  // Leave room and cleanup
  const leaveRoom = useCallback(() => {
    // Close all peer connections
    peersRef.current.forEach((peer) => {
      peer.connection.close();
    });

    // Stop local stream
    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    socket.emit("leave-video-room", { roomId, userId });

    // Reset state
    setPeers(new Map());
    setRemoteStreams(new Map());
    setLocalStream(null);
    setIsConnected(false);
  }, [roomId, userId, socket]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  // Toggle microphone
  const toggleMicrophone = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  return {
    localStream,
    remoteStreams,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMicrophone,
  };
};
