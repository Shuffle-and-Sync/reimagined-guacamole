import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { useCommunity } from "@/contexts/CommunityContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
    gameState?: any;
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
  type: 'chat' | 'game_action' | 'system';
}

export default function GameRoom() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity } = useCommunity();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [gameTimer, setGameTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [videoLayout, setVideoLayout] = useState<'grid' | 'focused'>('grid');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

  const sessionId = params.id;

  // Fetch game session details
  const { data: gameSession, isLoading } = useQuery<GameSession>({
    queryKey: ['/api/game-sessions', sessionId],
    enabled: !!sessionId,
  });

  // Initialize camera and microphone
  useEffect(() => {
    if (!user) return;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera/microphone:', error);
        toast({
          title: "Camera access required",
          description: "Please allow camera and microphone access for video chat.",
          variant: "destructive"
        });
      }
    };

    initializeMedia();
    
    // Start WebRTC connections for existing players
    if (connectedPlayers.length > 0) {
      connectedPlayers.forEach(player => {
        if (player.id !== user.id) {
          createPeerConnection(player.id);
        }
      });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [user]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionId || !user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('Connected to game room');
      // Send join message
      ws.current?.send(JSON.stringify({
        type: 'join_room',
        sessionId,
        user: {
          id: user.id,
          name: user.firstName || user.email,
          avatar: user.profileImageUrl
        }
      }));
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'player_joined':
          setConnectedPlayers(data.players);
          toast({
            title: "Player joined",
            description: `${data.player.name} joined the game room`
          });
          
          // Create WebRTC connection for new player
          if (data.player?.id !== user?.id && localStream) {
            setTimeout(() => createPeerConnection(data.player.id), 1000);
          }
          break;
        case 'player_left':
          setConnectedPlayers(data.players);
          toast({
            title: "Player left",
            description: `${data.player.name} left the game room`
          });
          
          // Clean up WebRTC connection
          const peerConnection = peerConnections.current.get(data.player.id);
          if (peerConnection) {
            peerConnection.close();
            peerConnections.current.delete(data.player.id);
          }
          
          // Remove remote stream
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(data.player.id);
            return newStreams;
          });
          break;
        case 'game_action':
          if (data.action === 'dice_roll') {
            toast({
              title: "Dice rolled",
              description: `${data.player} rolled a ${data.result}`
            });
          }
          break;
          
        case 'webrtc_offer':
          handleWebRTCOffer(data);
          break;
          
        case 'webrtc_answer':
          handleWebRTCAnswer(data);
          break;
          
        case 'webrtc_ice_candidate':
          handleICECandidate(data);
          break;
          
        case 'camera_status':
          // Update UI to show camera status for other players
          console.log(`Player ${data.playerName} ${data.cameraOn ? 'enabled' : 'disabled'} camera`);
          break;
          
        case 'mic_status':
          // Update UI to show microphone status for other players
          console.log(`Player ${data.playerName} ${data.micOn ? 'enabled' : 'disabled'} microphone`);
          break;
        case 'turn_change':
          toast({
            title: "Turn changed",
            description: `It's now ${data.player}'s turn`
          });
          break;
      }
    };
    
    ws.current.onclose = () => {
      console.log('Disconnected from game room');
    };
    
    return () => {
      ws.current?.close();
    };
  }, [sessionId, user]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Game timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setGameTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const sendMessage = () => {
    if (!newMessage.trim() || !ws.current) return;
    
    ws.current.send(JSON.stringify({
      type: 'message',
      sessionId,
      content: newMessage.trim(),
      user: {
        id: user?.id,
        name: user?.firstName || user?.email,
        avatar: user?.profileImageUrl
      }
    }));
    
    setNewMessage("");
  };

  const rollDice = (sides: number = 6) => {
    const result = Math.floor(Math.random() * sides) + 1;
    setDiceResult(result);
    
    ws.current?.send(JSON.stringify({
      type: 'game_action',
      sessionId,
      action: 'dice_roll',
      data: { sides, result },
      user: {
        id: user?.id,
        name: user?.firstName || user?.email
      }
    }));
    
    setTimeout(() => setDiceResult(null), 3000);
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setGameTimer(0);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setGameTimer(0);
  };

  const leaveRoom = async () => {
    if (!sessionId) return;
    
    try {
      await apiRequest('POST', `/api/game-sessions/${sessionId}/leave`);
      toast({
        title: "Left room",
        description: "You have left the game room"
      });
      setLocation('/tablesync');
    } catch (error) {
      toast({
        title: "Error leaving room",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // WebRTC Functions
  const createPeerConnection = async (playerId: string) => {
    if (peerConnections.current.has(playerId)) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnections.current.set(playerId, peerConnection);

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev.set(playerId, remoteStream)));
      
      // Set video element source
      const videoElement = remoteVideoRefs.current.get(playerId);
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && ws.current) {
        ws.current.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          targetPlayer: playerId,
          candidate: event.candidate,
          sessionId
        }));
      }
    };

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      ws.current?.send(JSON.stringify({
        type: 'webrtc_offer',
        targetPlayer: playerId,
        offer: offer,
        sessionId
      }));
    } catch (error) {
      console.error('Error creating WebRTC offer:', error);
    }
  };

  const handleWebRTCOffer = async (data: any) => {
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
        
        ws.current?.send(JSON.stringify({
          type: 'webrtc_answer',
          targetPlayer: fromPlayer,
          answer: answer,
          sessionId
        }));
      } catch (error) {
        console.error('Error handling WebRTC offer:', error);
      }
    }
  };

  const handleWebRTCAnswer = async (data: any) => {
    const { fromPlayer, answer } = data;
    const peerConnection = peerConnections.current.get(fromPlayer);
    
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling WebRTC answer:', error);
      }
    }
  };

  const handleICECandidate = async (data: any) => {
    const { fromPlayer, candidate } = data;
    const peerConnection = peerConnections.current.get(fromPlayer);
    
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <i className="fas fa-spinner animate-spin text-4xl text-muted-foreground mb-4"></i>
              <p className="text-lg text-muted-foreground">Loading game room...</p>
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
            <p className="text-muted-foreground mb-4">This game room may have been deleted or is no longer available.</p>
            <Button onClick={() => setLocation('/tablesync')}>
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
                  {gameSession.gameData?.name || 'Game Room'}
                </h1>
                <p className="text-muted-foreground">
                  Hosted by {gameSession.host?.firstName || gameSession.host?.email} • {gameSession.gameData?.format}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={gameSession.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                  {gameSession.status === 'active' ? 'Game Active' : 'Waiting for Players'}
                </Badge>
                <Button variant="outline" onClick={leaveRoom} data-testid="button-leave-room">
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
                    <p className="text-lg font-bold">{gameSession.currentPlayers}/{gameSession.maxPlayers}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-chess-board text-2xl text-orange-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Format</p>
                    <p className="text-lg font-bold">{gameSession.gameData?.format}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <i className="fas fa-bolt text-2xl text-yellow-500 mb-2"></i>
                    <p className="text-sm text-muted-foreground">Power Level</p>
                    <p className="text-lg font-bold">{gameSession.gameData?.powerLevel || 'Any'}</p>
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
                    <Button
                      variant={isCameraOn ? "default" : "destructive"}
                      size="sm"
                      onClick={() => {
                        if (localStream) {
                          const videoTrack = localStream.getVideoTracks()[0];
                          if (videoTrack) {
                            videoTrack.enabled = !isCameraOn;
                            setIsCameraOn(!isCameraOn);
                          }
                        }
                      }}
                      data-testid="button-toggle-camera"
                    >
                      <i className={`fas ${isCameraOn ? 'fa-video' : 'fa-video-slash'} mr-2`}></i>
                      {isCameraOn ? 'Camera On' : 'Camera Off'}
                    </Button>
                    <Button
                      variant={isMicOn ? "default" : "destructive"}
                      size="sm"
                      onClick={() => {
                        if (localStream) {
                          const audioTrack = localStream.getAudioTracks()[0];
                          if (audioTrack) {
                            audioTrack.enabled = !isMicOn;
                            setIsMicOn(!isMicOn);
                          }
                        }
                      }}
                      data-testid="button-toggle-mic"
                    >
                      <i className={`fas ${isMicOn ? 'fa-microphone' : 'fa-microphone-slash'} mr-2`}></i>
                      {isMicOn ? 'Mic On' : 'Mic Off'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVideoLayout(videoLayout === 'grid' ? 'focused' : 'grid')}
                      data-testid="button-toggle-layout"
                    >
                      <i className={`fas ${videoLayout === 'grid' ? 'fa-expand' : 'fa-th'} mr-2`}></i>
                      {videoLayout === 'grid' ? 'Focus Mode' : 'Grid View'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${videoLayout === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Local Video (Your Camera) */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
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
                      You ({user?.firstName || 'Player'})
                    </div>
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
                  </div>

                  {/* Remote Videos (Other Players) */}
                  {connectedPlayers.map((player, index) => {
                    const hasStream = remoteStreams.has(player.id);
                    return (
                      <div key={player.id} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                        {hasStream ? (
                          <video
                            ref={(ref) => {
                              if (ref && remoteStreams.get(player.id)) {
                                ref.srcObject = remoteStreams.get(player.id)!;
                                remoteVideoRefs.current.set(player.id, ref);
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
                                  <img src={player.avatar} alt={player.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <span className="text-xl font-bold">{player.name?.charAt(0).toUpperCase()}</span>
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
                  {Array.from({ length: Math.max(0, 3 - connectedPlayers.length) }, (_, index) => (
                    <div key={`empty-${index}`} className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <i className="fas fa-user-plus text-3xl mb-2"></i>
                          <p className="text-sm">Waiting for player...</p>
                          <p className="text-xs">Invite friends to join</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video Tips */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-lightbulb text-blue-500 mt-1"></i>
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-1">Video Chat Tips</p>
                      <p className="text-blue-600 dark:text-blue-400">
                        Position your camera to show your playing area clearly. Use good lighting and ensure your cards are visible to other players.
                      </p>
                    </div>
                  </div>
                </div>
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
                    {connectedPlayers.length > 0 ? connectedPlayers.map((player, index) => (
                      <div key={player.id || index} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>
                            {(player.name || 'P').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {player.id === gameSession.hostId ? 'Host' : 'Player'}
                          </p>
                        </div>
                        {player.id === gameSession.gameData?.currentTurn && (
                          <Badge variant="default" className="ml-auto">
                            <i className="fas fa-arrow-right mr-1"></i>
                            Turn
                          </Badge>
                        )}
                      </div>
                    )) : (
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[4, 6, 8, 10, 12, 20].map((sides) => (
                          <Button
                            key={sides}
                            variant="outline"
                            onClick={() => rollDice(sides)}
                            data-testid={`button-dice-${sides}`}
                            className="h-12"
                          >
                            <i className="fas fa-dice mr-1"></i>
                            d{sides}
                          </Button>
                        ))}
                      </div>
                      {diceResult && (
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {diceResult}
                          </div>
                          <p className="text-sm text-muted-foreground">Last roll result</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="timer" className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-mono font-bold mb-4">
                          {formatTime(gameTimer)}
                        </div>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant={isTimerRunning ? "default" : "outline"}
                            onClick={isTimerRunning ? pauseTimer : startTimer}
                            data-testid="button-timer-toggle"
                          >
                            <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'} mr-2`}></i>
                            {isTimerRunning ? 'Pause' : 'Start'}
                          </Button>
                          <Button variant="outline" onClick={resetTimer} data-testid="button-timer-reset">
                            <i className="fas fa-redo mr-2"></i>
                            Reset
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="notes" className="space-y-4">
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground mb-2">Room Description:</p>
                        <p className="text-sm">{gameSession.gameData?.description || 'No description provided'}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Game Notes:</p>
                        <p className="text-sm italic text-muted-foreground">
                          Use the chat to coordinate and share notes during gameplay
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
                              <AvatarImage src={message.sender?.profileImageUrl} />
                              <AvatarFallback>
                                {(message.sender?.firstName || message.sender?.email || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {message.sender?.firstName || message.sender?.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                                {message.type === 'game_action' && (
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
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        data-testid="input-chat-message"
                      />
                      <Button onClick={sendMessage} data-testid="button-send-message">
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </div>
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
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => rollDice(6)} data-testid="button-quick-dice">
                      <i className="fas fa-dice mr-2"></i>
                      Quick d6
                    </Button>
                    <Button variant="outline" onClick={() => rollDice(20)} data-testid="button-quick-d20">
                      <i className="fas fa-dice-d20 mr-2"></i>
                      Quick d20
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={isTimerRunning ? pauseTimer : startTimer}
                      data-testid="button-quick-timer"
                    >
                      <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'} mr-2`}></i>
                      {isTimerRunning ? 'Pause' : 'Start'} Timer
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Room Code: <code className="font-mono bg-muted px-2 py-1 rounded">{sessionId?.slice(-6).toUpperCase()}</code>
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