import { Phone, PhoneOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWebRTC } from "../hooks/useWebRTC";
import { VideoFeed } from "./VideoFeed";

interface VideoRoomProps {
  roomId: string;
  userId: string;
  userName?: string;
  socket: Socket;
  iceServers?: RTCIceServer[];
  onLeave?: () => void;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
];

export function VideoRoom({
  roomId,
  userId,
  userName = "Player",
  socket,
  iceServers = DEFAULT_ICE_SERVERS,
  onLeave,
}: VideoRoomProps) {
  const [hasJoined, setHasJoined] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const {
    localStream,
    remoteStreams,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    toggleCamera,
    toggleMicrophone,
  } = useWebRTC({
    roomId,
    userId,
    socket,
    iceServers,
  });

  const handleJoinRoom = async () => {
    try {
      await joinRoom();
      setHasJoined(true);
    } catch (err) {
      console.error("Failed to join room:", err);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setHasJoined(false);
    if (onLeave) {
      onLeave();
    }
  };

  const handleToggleCamera = () => {
    const enabled = toggleCamera();
    setIsCameraOff(!enabled);
  };

  const handleToggleMicrophone = () => {
    const enabled = toggleMicrophone();
    setIsMuted(!enabled);
  };

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (hasJoined) {
        leaveRoom();
      }
    };
    // Only run on unmount - disable exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert remote streams to array for rendering
  const remoteStreamArray = Array.from(remoteStreams.entries());

  return (
    <div className="space-y-4">
      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Join/Leave controls */}
      {!hasJoined ? (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">Ready to Join?</h3>
          <p className="text-sm text-gray-600 mb-6">
            Make sure your camera and microphone are ready. You can adjust them
            after joining.
          </p>
          <Button
            onClick={handleJoinRoom}
            size="lg"
            className="w-full md:w-auto"
          >
            <Phone className="w-4 h-4 mr-2" />
            Join Video Room
          </Button>
        </Card>
      ) : (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <Button onClick={handleLeaveRoom} variant="destructive" size="sm">
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>
      )}

      {/* Video grid */}
      {hasJoined && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local video */}
          <VideoFeed
            stream={localStream}
            userId={userId}
            userName={userName}
            isLocal={true}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            onToggleCamera={handleToggleCamera}
            onToggleMicrophone={handleToggleMicrophone}
          />

          {/* Remote videos */}
          {remoteStreamArray.map(([peerId, stream]) => (
            <VideoFeed
              key={peerId}
              stream={stream}
              userId={peerId}
              userName={`Player ${peerId.slice(0, 6)}`}
              isLocal={false}
            />
          ))}

          {/* Placeholder for empty slots (up to 4 total) */}
          {remoteStreamArray.length < 3 && hasJoined && (
            <>
              {Array.from({ length: 3 - remoteStreamArray.length }).map(
                (_, i) => (
                  <Card
                    key={`placeholder-${i}`}
                    className="aspect-video bg-gray-100 flex items-center justify-center"
                  >
                    <div className="text-center text-gray-400">
                      <p className="text-sm">Waiting for player...</p>
                    </div>
                  </Card>
                ),
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
