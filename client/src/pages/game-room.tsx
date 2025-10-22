import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { getErrorMessage } from "@shared/type-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/shared/components";

interface GameSession {
  id: string;
  eventId: string;
  hostId: string;
  coHostId?: string;
  status: string;
  currentPlayers: number;
  maxPlayers: number;
  gameData?: {
    name: string;
    format: string;
    powerLevel: string;
    description: string;
    currentTurn?: string;
    turnOrder?: string[];
    gameState?: unknown;
  };
  host: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  startedAt?: string;
}

interface GameMessage {
  id: string;
  senderId: string;
  sender: {
    firstName?: string;
    lastName?: string;
    email: string;
    profileImageUrl?: string;
  };
  content: string;
  timestamp: string;
  type: "chat" | "game_action" | "system";
}

interface ConnectedPlayer {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string;
}

export default function GameRoom() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity } = useCommunity();
  const _queryClient = useQueryClient();

  // Check if user is in spectator mode
  const searchParams = new URLSearchParams(window.location.search);
  const isSpectatorMode = searchParams.get("mode") === "spectate";
  const [newMessage, setNewMessage] = useState("");
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [gameTimer, setGameTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>(
    [],
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoLayout, setVideoLayout] = useState<"grid" | "focused">("grid");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [_recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const sessionId = params.id;

  // Fetch game session details
  const { data: gameSession, isLoading } = useQuery<GameSession>({
    queryKey: ["/api/game-sessions", sessionId],
    enabled: !!sessionId,
  });

  // WebRTC Functions - wrapped with useCallback for stable references
  const createPeerConnection = useCallback(
    async (playerId: string) => {
      if (peerConnections.current.has(playerId)) return;

      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      peerConnections.current.set(playerId, peerConnection);

      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          setRemoteStreams((prev) => new Map(prev.set(playerId, remoteStream)));

          // Set video element source
          const videoElement = remoteVideoRefs.current.get(playerId);
          if (videoElement) {
            videoElement.srcObject = remoteStream;
          }
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && ws.current) {
          ws.current.send(
            JSON.stringify({
              type: "webrtc_ice_candidate",
              targetPlayer: playerId,
              candidate: event.candidate,
              sessionId,
            }),
          );
        }
      };

      // Create and send offer
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        ws.current?.send(
          JSON.stringify({
            type: "webrtc_offer",
            targetPlayer: playerId,
            offer: offer,
            sessionId,
          }),
        );
      } catch (error) {
        // Log error for debugging
        if (import.meta.env.DEV) {
          console.error("Error creating WebRTC offer:", error);
        }
      }
    },
    [localStream, sessionId],
  );

  const handleWebRTCOffer = useCallback(
    async (data: unknown) => {
      const { fromPlayer, offer } = data;

      if (!peerConnections.current.has(fromPlayer)) {
        await createPeerConnection(fromPlayer);
      }

      const peerConnection = peerConnections.current.get(fromPlayer);
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          ws.current?.send(
            JSON.stringify({
              type: "webrtc_answer",
              targetPlayer: fromPlayer,
              answer: answer,
              sessionId,
            }),
          );
        } catch (error) {
          // Log error for debugging
          if (import.meta.env.DEV) {
            console.error("Error handling WebRTC offer:", error);
          }
        }
      }
    },
    [createPeerConnection, sessionId],
  );

  const handleWebRTCAnswer = useCallback(async (data: unknown) => {
    const { fromPlayer, answer } = data;
    const peerConnection = peerConnections.current.get(fromPlayer);

    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        // Log error for debugging
        if (import.meta.env.DEV) {
          console.error("Error handling WebRTC answer:", error);
        }
      }
    }
  }, []);

  const handleICECandidate = useCallback(async (data: unknown) => {
    const { fromPlayer, candidate } = data;
    const peerConnection = peerConnections.current.get(fromPlayer);

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        // Log error for debugging
        if (import.meta.env.DEV) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    }
  }, []);

  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setLocalStream(stream);
      setCameraPermissionGranted(true);
      setIsCameraOn(true);
      setIsMicOn(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Start WebRTC connections for existing players
      connectedPlayers.forEach((player) => {
        if (player.id !== user?.id) {
          createPeerConnection(player.id);
        }
      });

      toast({
        title: "Camera enabled",
        description: "Video chat is now active for the game room.",
      });
    } catch (error: unknown) {
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error("Error accessing camera/microphone:", error);
      }
      setCameraPermissionGranted(false);

      let errorMessage =
        "Camera and microphone access is needed for video chat.";

      const errorObj = error as { name?: string };
      if (errorObj.name === "NotAllowedError") {
        errorMessage =
          "Please allow camera and microphone access in your browser settings.";
      } else if (errorObj.name === "NotFoundError") {
        errorMessage =
          "No camera or microphone found. Please connect a camera to use video chat.";
      } else if (errorObj.name === "NotSupportedError") {
        errorMessage =
          "Video chat is not supported in this browser or environment.";
      }

      setCameraError(errorMessage);
    }
  }, [connectedPlayers, user, createPeerConnection, toast]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      // Connected to game room - no logging needed in production
      // Send join message
      ws.current?.send(
        JSON.stringify({
          type: "join_room",
          sessionId,
          user: {
            id: user.id,
            name: user.firstName || user.email,
            avatar: user.profileImageUrl,
          },
        }),
      );
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "message":
          setMessages((prev) => [...prev, data.message]);
          break;
        case "player_joined":
          setConnectedPlayers(data.players);
          toast({
            title: "Player joined",
            description: `${data.player.name} joined the game room`,
          });

          // Create WebRTC connection for new player
          if (data.player?.id !== user?.id && localStream) {
            setTimeout(() => createPeerConnection(data.player.id), 1000);
          }
          break;
        case "player_left": {
          setConnectedPlayers(data.players);
          toast({
            title: "Player left",
            description: `${data.player.name} left the game room`,
          });

          // Clean up WebRTC connection
          const peerConnection = peerConnections.current.get(data.player.id);
          if (peerConnection) {
            peerConnection.close();
            peerConnections.current.delete(data.player.id);
          }

          // Remove remote stream
          setRemoteStreams((prev) => {
            const newStreams = new Map(prev);
            newStreams.delete(data.player.id);
            return newStreams;
          });
          break;
        }
        case "game_action":
          if (data.action === "dice_roll") {
            toast({
              title: "Dice rolled",
              description: `${data.player} rolled a ${data.result}`,
            });
          }
          break;

        case "webrtc_offer":
          handleWebRTCOffer(data);
          break;

        case "webrtc_answer":
          handleWebRTCAnswer(data);
          break;

        case "webrtc_ice_candidate":
          handleICECandidate(data);
          break;

        case "camera_status":
          // Update UI to show camera status for other players
          // Player camera status update - visual feedback handled by UI
          break;

        case "mic_status":
          // Update UI to show microphone status for other players
          // Player microphone status update - visual feedback handled by UI
          break;
        case "turn_change":
          toast({
            title: "Turn changed",
            description: `It&apos;s now ${data.player}'s turn`,
          });
          break;
      }
    };

    ws.current.onclose = () => {
      // Disconnected from game room - handled by UI state
    };

    return () => {
      ws.current?.close();
    };
  }, [
    sessionId,
    user,
    createPeerConnection,
    handleWebRTCOffer,
    handleWebRTCAnswer,
    handleICECandidate,
    localStream,
    toast,
  ]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Game timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setGameTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !ws.current) return;

    ws.current.send(
      JSON.stringify({
        type: "message",
        sessionId,
        content: newMessage.trim(),
        user: {
          id: user?.id,
          name: user?.firstName || user?.email,
          avatar: user?.profileImageUrl,
        },
      }),
    );

    setNewMessage("");
  }, [newMessage, sessionId, user]);

  const rollDice = useCallback(
    (sides: number = 6) => {
      const result = Math.floor(Math.random() * sides) + 1;
      setDiceResult(result);

      ws.current?.send(
        JSON.stringify({
          type: "game_action",
          sessionId,
          action: "dice_roll",
          data: { sides, result },
          user: {
            id: user?.id,
            name: user?.firstName || user?.email,
          },
        }),
      );

      setTimeout(() => setDiceResult(null), 3000);
    },
    [sessionId, user],
  );

  const startTimer = useCallback(() => {
    setIsTimerRunning(true);
    setGameTimer(0);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setGameTimer(0);
  }, []);

  const leaveRoom = useCallback(async () => {
    if (!sessionId) return;

    try {
      await apiRequest("POST", `/api/game-sessions/${sessionId}/leave`);
      toast({
        title: "Left room",
        description: "You have left the game room",
      });
      setLocation("/tablesync");
    } catch {
      toast({
        title: "Error leaving room",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [sessionId, toast, setLocation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Screen Sharing Functions
  const stopScreenShare = useCallback(async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }
    setIsScreenSharing(false);

    // Switch back to camera feed
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        peerConnections.current.forEach(async (pc, _playerId) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        });
      }
    }

    toast({
      title: "Screen sharing stopped",
      description: "Switched back to camera feed",
    });
  }, [screenStream, localStream, toast]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        peerConnections.current.forEach(async (pc, _playerId) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        });
      }

      // Handle screen share end
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      toast({
        title: "Screen sharing started",
        description: "Your screen is now being shared with other players",
      });
    } catch (error) {
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error("Error starting screen share:", error);
      }
      toast({
        title: "Screen sharing failed",
        description: "Could not start screen sharing. Please try again.",
        variant: "destructive",
      });
    }
  }, [stopScreenShare, toast]);

  // Recording Functions
  const startRecording = useCallback(async () => {
    if (!localStream) {
      toast({
        title: "Cannot start recording",
        description: "Please enable your camera first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a combined stream with local video and audio
      const combinedStream = new MediaStream();

      // Add local tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });
      }

      // Add remote audio tracks
      remoteStreams.forEach((stream) => {
        stream.getAudioTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });
      });

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `game-session-${sessionId}-${new Date().toISOString().split("T")[0]}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Recording saved",
          description: "Your game session recording has been downloaded",
        });
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setRecordedChunks(chunks);
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Your game session is now being recorded",
      });
    } catch (error) {
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error("Error starting recording:", error);
      }
      toast({
        title: "Recording failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive",
      });
    }
  }, [localStream, remoteStreams, sessionId, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);

      toast({
        title: "Recording stopped",
        description: "Processing your recording...",
      });
    }
  }, [mediaRecorder, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-spinner animate-spin text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg text-muted-foreground">
                Loading game room...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
            <h2 className="text-2xl font-bold mb-2">Room Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This game room may have been deleted or is no longer available.
            </p>
            <Button onClick={() => setLocation("/tablesync")}>
              <i className="fas fa-arrow-left mr-2"></i>
              Back to TableSync
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Room Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {gameSession.gameData?.name || "Game Room"}
                </h1>
                <p className="text-muted-foreground">
                  Hosted by{" "}
                  {gameSession.host?.firstName || gameSession.host?.email} •{" "}
                  {gameSession.gameData?.format}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    gameSession.status === "active" ? "default" : "secondary"
                  }
                  className="text-sm"
                >
                  {gameSession.status === "active"
                    ? "Game Active"
                    : "Waiting for Players"}
                </Badge>
                <Button
                  variant="outline"
                  onClick={leaveRoom}
                  data-testid="button-leave-room"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Leave Room
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-users text-2xl text-purple-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Players</p>
                    <p className="text-lg font-bold">
                      {gameSession.currentPlayers}/{gameSession.maxPlayers}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-chess-board text-2xl text-orange-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="text-lg font-bold">
                      {gameSession.gameData?.format}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-bolt text-2xl text-yellow-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Power Level</p>
                    <p className="text-lg font-bold">
                      {gameSession.gameData?.powerLevel || "Any"}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-clock text-2xl text-blue-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Game Time</p>
                    <p className="text-lg font-bold">{formatTime(gameTimer)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Video Chat Section */}
          <div className="mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-video text-blue-500"></i>
                    Video Chat ({connectedPlayers.length + 1}/4 players)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isSpectatorMode ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <i className="fas fa-eye mr-2"></i>
                        <span className="text-sm">
                          Spectator Mode - Video controls disabled
                        </span>
                      </div>
                    ) : (
                      <>
                        {!cameraPermissionGranted ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={initializeMedia}
                            data-testid="button-enable-camera"
                          >
                            <i className="fas fa-video mr-2"></i>
                            Enable Camera
                          </Button>
                        ) : (
                          <Button
                            variant={isCameraOn ? "default" : "destructive"}
                            size="sm"
                            onClick={() => {
                              if (localStream) {
                                const videoTrack =
                                  localStream.getVideoTracks()[0];
                                if (videoTrack) {
                                  videoTrack.enabled = !isCameraOn;
                                  setIsCameraOn(!isCameraOn);
                                }
                              }
                            }}
                            data-testid="button-toggle-camera"
                          >
                            <i
                              className={`fas ${isCameraOn ? "fa-video" : "fa-video-slash"} mr-2`}
                            ></i>
                            {isCameraOn ? "Camera On" : "Camera Off"}
                          </Button>
                        )}
                        {cameraPermissionGranted && (
                          <Button
                            variant={isMicOn ? "default" : "destructive"}
                            size="sm"
                            onClick={() => {
                              if (localStream) {
                                const audioTrack =
                                  localStream.getAudioTracks()[0];
                                if (audioTrack) {
                                  audioTrack.enabled = !isMicOn;
                                  setIsMicOn(!isMicOn);
                                }
                              }
                            }}
                            data-testid="button-toggle-mic"
                          >
                            <i
                              className={`fas ${isMicOn ? "fa-microphone" : "fa-microphone-slash"} mr-2`}
                            ></i>
                            {isMicOn ? "Mic On" : "Mic Off"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setVideoLayout(
                              videoLayout === "grid" ? "focused" : "grid",
                            )
                          }
                          data-testid="button-toggle-layout"
                        >
                          <i
                            className={`fas ${videoLayout === "grid" ? "fa-expand" : "fa-th"} mr-2`}
                          ></i>
                          {videoLayout === "grid" ? "Focus Mode" : "Grid View"}
                        </Button>
                        <Button
                          variant={isScreenSharing ? "destructive" : "outline"}
                          size="sm"
                          onClick={
                            isScreenSharing ? stopScreenShare : startScreenShare
                          }
                          data-testid="button-screen-share"
                        >
                          <i
                            className={`fas ${isScreenSharing ? "fa-stop" : "fa-desktop"} mr-2`}
                          ></i>
                          {isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        </Button>
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={!cameraPermissionGranted}
                          data-testid="button-record"
                        >
                          <i
                            className={`fas ${isRecording ? "fa-stop-circle" : "fa-record-vinyl"} mr-2`}
                          ></i>
                          {isRecording ? "Stop Recording" : "Record Session"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`grid gap-4 ${videoLayout === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
                >
                  {/* Local Video (Your Camera) */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    {cameraPermissionGranted ? (
                      <>
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          data-testid="video-local"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          <i className="fas fa-user mr-1"></i>
                          You ({user?.firstName || "Player"})
                          {isScreenSharing && (
                            <span className="ml-2 bg-green-500 px-1 rounded text-xs">
                              <i className="fas fa-desktop mr-1"></i>Sharing
                            </span>
                          )}
                        </div>
                        {isRecording && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm animate-pulse">
                            <i className="fas fa-record-vinyl mr-1"></i>
                            REC
                          </div>
                        )}
                        {!isCameraOn && (
                          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <div className="text-center text-white">
                              <i className="fas fa-video-slash text-4xl mb-2"></i>
                              <p>Camera Off</p>
                            </div>
                          </div>
                        )}
                        {!isMicOn && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
                            <i className="fas fa-microphone-slash text-sm"></i>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                        <div className="text-center text-white p-4">
                          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-3 mx-auto">
                            {user?.profileImageUrl ? (
                              <img
                                src={user.profileImageUrl}
                                alt="Your avatar"
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold">
                                {user?.firstName?.charAt(0).toUpperCase() ||
                                  "Y"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">
                            You ({user?.firstName || "Player"})
                          </p>
                          {cameraError ? (
                            <p className="text-xs text-gray-300">
                              {cameraError}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300">
                              Click &quot;Enable Camera&quot; to join video chat
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remote Videos (Other Players) */}
                  {connectedPlayers.map((player, _index) => {
                    const hasStream = remoteStreams.has(player.id);
                    return (
                      <div
                        key={player.id}
                        className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
                      >
                        {hasStream ? (
                          <video
                            ref={(ref) => {
                              if (ref) {
                                const stream = remoteStreams.get(player.id);
                                if (stream) {
                                  ref.srcObject = stream;
                                  remoteVideoRefs.current.set(player.id, ref);
                                }
                              }
                            }}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                            data-testid={`video-remote-${player.id}`}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                                {player.avatar ? (
                                  <img
                                    src={player.avatar}
                                    alt={player.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl font-bold">
                                    {player.name?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm">{player.name}</p>
                              <p className="text-xs text-gray-400">
                                <i className="fas fa-spinner animate-spin mr-1"></i>
                                Connecting camera...
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          <i className="fas fa-user mr-1"></i>
                          {player.name}
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty Slots */}
                  {Array.from(
                    { length: Math.max(0, 3 - connectedPlayers.length) },
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <i className="fas fa-user-plus text-3xl mb-2"></i>
                            <p className="text-sm">Waiting for player...</p>
                            <p className="text-xs">Invite friends to join</p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {/* Video Tips */}
                {cameraPermissionGranted ? (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-lightbulb text-blue-500 mt-1"></i>
                      <div className="text-sm">
                        <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Video Chat Tips
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                          Position your camera to show your playing area
                          clearly. Use good lighting and ensure your cards are
                          visible to other players.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <i className="fas fa-info-circle text-amber-500 mt-1"></i>
                      <div className="text-sm">
                        <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                          Video Chat Available
                        </p>
                        <p className="text-amber-600 dark:text-amber-400">
                          Enable your camera to see other players and show your
                          playing area. Video chat works like SpellTable for
                          remote card game play.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Player List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-users text-purple-500"></i>
                    Connected Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {connectedPlayers.length > 0 ? (
                      connectedPlayers.map((player, index) => (
                        <div
                          key={player.id || index}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback>
                              {(player.name || "P").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {player.id === gameSession.hostId
                                ? "Host"
                                : "Player"}
                            </p>
                          </div>
                          {player.id === gameSession.gameData?.currentTurn && (
                            <Badge variant="default" className="ml-auto">
                              <i className="fas fa-arrow-right mr-1"></i>
                              Turn
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        <i className="fas fa-user-friends text-3xl mb-2"></i>
                        <p>Waiting for players to connect...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Game Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-tools text-orange-500"></i>
                    Game Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="dice" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="dice">
                        <i className="fas fa-dice mr-2"></i>
                        Dice
                      </TabsTrigger>
                      <TabsTrigger value="timer">
                        <i className="fas fa-stopwatch mr-2"></i>
                        Timer
                      </TabsTrigger>
                      <TabsTrigger value="notes">
                        <i className="fas fa-sticky-note mr-2"></i>
                        Notes
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dice" className="space-y-4">
                      {isSpectatorMode ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <i className="fas fa-eye text-3xl mb-2"></i>
                          <p>Spectator mode - dice rolls are view-only</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[4, 6, 8, 10, 12, 20].map((sides) => (
                              <Button
                                key={sides}
                                variant="outline"
                                onClick={() => rollDice(sides)}
                                data-testid={`button-dice-${sides}`}
                                className="h-12"
                              >
                                <i className="fas fa-dice mr-1"></i>d{sides}
                              </Button>
                            ))}
                          </div>
                          {diceResult && (
                            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                                {diceResult}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Last roll result
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="timer" className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-mono font-bold mb-4">
                          {formatTime(gameTimer)}
                        </div>
                        {isSpectatorMode ? (
                          <div className="text-muted-foreground">
                            <i className="fas fa-eye mr-2"></i>
                            Spectator mode - timer is view-only
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <Button
                              variant={isTimerRunning ? "default" : "outline"}
                              onClick={isTimerRunning ? pauseTimer : startTimer}
                              data-testid="button-timer-toggle"
                            >
                              <i
                                className={`fas ${isTimerRunning ? "fa-pause" : "fa-play"} mr-2`}
                              ></i>
                              {isTimerRunning ? "Pause" : "Start"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={resetTimer}
                              data-testid="button-timer-reset"
                            >
                              <i className="fas fa-redo mr-2"></i>
                              Reset
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">
                          Room Description:
                        </p>
                        <p className="text-sm">
                          {gameSession.gameData?.description ||
                            "No description provided"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          Game Notes:
                        </p>
                        <p className="text-sm italic text-muted-foreground">
                          Use the chat to coordinate and share notes during
                          gameplay
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Chat Sidebar */}
            <div>
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <i className="fas fa-comments text-blue-500"></i>
                    Game Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <i className="fas fa-comment-dots text-2xl mb-2"></i>
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={message.sender?.profileImageUrl}
                              />
                              <AvatarFallback>
                                {(
                                  message.sender?.firstName ||
                                  message.sender?.email ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {message.sender?.firstName ||
                                    message.sender?.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    message.timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                                {message.type === "game_action" && (
                                  <Badge variant="outline" className="text-xs">
                                    Game Action
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="p-4 flex-shrink-0">
                    {isSpectatorMode ? (
                      <div className="text-center text-muted-foreground py-2">
                        <i className="fas fa-eye mr-2"></i>
                        Spectator mode - chat is view-only
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          data-testid="input-chat-message"
                        />
                        <Button
                          onClick={sendMessage}
                          data-testid="button-send-message"
                        >
                          <i className="fas fa-paper-plane"></i>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mt-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  {isSpectatorMode ? (
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <i className="fas fa-eye mr-2"></i>
                      <span>
                        Spectator Mode - You can watch but not interact with
                        game controls
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => rollDice(6)}
                        data-testid="button-quick-dice"
                      >
                        <i className="fas fa-dice mr-2"></i>
                        Quick d6
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rollDice(20)}
                        data-testid="button-quick-d20"
                      >
                        <i className="fas fa-dice-d20 mr-2"></i>
                        Quick d20
                      </Button>
                      <Button
                        variant="outline"
                        onClick={isTimerRunning ? pauseTimer : startTimer}
                        data-testid="button-quick-timer"
                      >
                        <i
                          className={`fas ${isTimerRunning ? "fa-pause" : "fa-play"} mr-2`}
                        ></i>
                        {isTimerRunning ? "Pause" : "Start"} Timer
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Room Code:{" "}
                      <code className="font-mono bg-muted px-2 py-1 rounded">
                        {sessionId?.slice(-6).toUpperCase()}
                      </code>
                    </div>
                    {diceResult && (
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <i className="fas fa-dice"></i>
                        <span className="font-bold">Rolled: {diceResult}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
