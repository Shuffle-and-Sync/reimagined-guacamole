import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation, useRoute } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth";
import { VideoRoom } from "@/features/video";

export default function VideoRoomPage() {
  const [, params] = useRoute("/video-room/:roomId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [roomId, setRoomId] = useState(params?.roomId || "");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection - using callback pattern to avoid cascading renders
  useEffect(() => {
    if (!roomId) return;

    // Create socket asynchronously
    const initSocket = () => {
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const newSocket = io(socketUrl, {
        path: "/socket.io/",
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
        setError(null);
      });

      newSocket.on("disconnect", () => {
        setIsConnected(false);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError("Failed to connect to server. Please try again.");
        setIsConnected(false);
      });

      return newSocket;
    };

    const newSocket = initSocket();
    // Defer state update to next tick
    Promise.resolve().then(() => setSocket(newSocket));

    return () => {
      newSocket.close();
    };
  }, [roomId]);

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setLocation(`/video-room/${roomId.trim()}`);
    }
  };

  const handleLeaveRoom = () => {
    setLocation("/video-room");
    setRoomId("");
  };

  // If user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Video Room</CardTitle>
            <CardDescription>
              Please sign in to join a video room
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/auth/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Room selection screen
  if (!params?.roomId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Join Video Room</CardTitle>
            <CardDescription>
              Enter a room ID to join or create a new video room for remote
              gameplay
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomId">Room ID</Label>
              <Input
                id="roomId"
                placeholder="Enter room ID (e.g., mtg-game-123)"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <p className="text-sm text-gray-500">
                Use a unique room ID to play with specific friends, or generate
                a random one
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="flex-1"
              >
                Join Room
              </Button>
              <Button
                variant="outline"
                onClick={() => setRoomId(crypto.randomUUID().slice(0, 8))}
              >
                Generate ID
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Features:</strong> Video chat with 2-4 players, built-in
                card recognition, game state tracking, and turn management for
                remote TCG gameplay.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Video room screen
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Room: {params.roomId}</h1>
        <p className="text-gray-600">
          Remote gameplay with video streaming and card recognition
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Connecting to server...</AlertDescription>
        </Alert>
      )}

      {socket && isConnected && (
        <VideoRoom
          roomId={params.roomId}
          userId={user.id}
          userName={user.name || user.email || "Player"}
          socket={socket}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}
