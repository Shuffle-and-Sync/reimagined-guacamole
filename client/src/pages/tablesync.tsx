import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { useCommunity } from "@/contexts/CommunityContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const GAME_FORMATS = [
  { id: "commander", name: "Commander/EDH", players: "2-4 players" },
  { id: "standard", name: "Standard", players: "2 players" },
  { id: "modern", name: "Modern", players: "2 players" },
  { id: "legacy", name: "Legacy", players: "2 players" },
  { id: "draft", name: "Draft", players: "4-8 players" },
  { id: "sealed", name: "Sealed", players: "2-8 players" },
  { id: "casual", name: "Casual", players: "2-6 players" },
];

interface GameRoom {
  id: string;
  name: string;
  host: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  format: string;
  currentPlayers: number;
  maxPlayers: number;
  powerLevel: string;
  description: string;
  communityId: string;
  status: string;
  gameData?: any;
  createdAt: string;
}

export default function TableSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity, communityTheme } = useCommunity();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [roomName, setRoomName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [powerLevel, setPowerLevel] = useState("");
  const [description, setDescription] = useState("");
  const [activeTab, setActiveTab] = useState("join");
  
  // Fetch active game sessions
  const { data: gameSessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/game-sessions'],
    select: (data: GameRoom[]) => data.filter(session => session.status === 'waiting'),
  });

  // Fetch upcoming game pod events that users can join
  const { data: gameEvents = [], isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events', 'game_pod', 'upcoming'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'game_pod');
      params.append('upcoming', 'true');
      if (selectedCommunity?.id) params.append('communityId', selectedCommunity.id);
      
      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch game pod events');
      return response.json();
    },
  });
  
  // Create game session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest('POST', '/api/game-sessions', sessionData);
      return await response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions'] });
      toast({
        title: "Room created successfully!",
        description: `Your ${selectedFormat} room "${roomName}" is now live. Redirecting to game room...`
      });
      // Redirect to the game room
      setLocation(`/tablesync/room/${newSession.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create room",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  });
  
  // Join game session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest('POST', `/api/game-sessions/${sessionId}/join`);
      return await response.json();
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-sessions'] });
      toast({
        title: "Successfully joined!",
        description: "Connecting to game room..."
      });
      // Redirect to the game room
      setLocation(`/tablesync/room/${sessionId}`);
    },
    onError: () => {
      toast({
        title: "Failed to join room",
        description: "Room may be full or no longer available.",
        variant: "destructive"
      });
    }
  });

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast({
        title: "Room name required",
        description: "Please enter a name for your game room.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFormat) {
      toast({
        title: "Format required",
        description: "Please select a game format for your room.",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a game room.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a temporary event for this game session
    const tempEvent = {
      title: `${roomName} - ${selectedFormat}`,
      description: description.trim() || `${selectedFormat} game session`,
      type: "stream",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      location: "TableSync Remote",
      communityId: selectedCommunity?.id,
      maxAttendees: parseInt(maxPlayers),
    };
    
    try {
      // First create an event
      const eventResponse = await apiRequest('POST', '/api/events', tempEvent);
      const event = await eventResponse.json();
      
      // Then create the game session
      const sessionData = {
        eventId: event.id,
        maxPlayers: parseInt(maxPlayers),
        communityId: selectedCommunity?.id,
        gameData: {
          name: roomName,
          format: selectedFormat,
          powerLevel,
          description: description.trim(),
        }
      };
      
      createSessionMutation.mutate(sessionData);
      
      // Reset form after successful submission
      setRoomName("");
      setSelectedFormat("");
      setMaxPlayers("4");
      setPowerLevel("");
      setDescription("");
      
    } catch (error) {
      toast({
        title: "Failed to create room",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleJoinRoom = (sessionId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join a game room.",
        variant: "destructive"
      });
      return;
    }
    
    const session = gameSessions.find(s => s.id === sessionId);
    if (session) {
      if (session.currentPlayers >= session.maxPlayers) {
        toast({
          title: "Room is full",
          description: `This room has reached its maximum capacity of ${session.maxPlayers} players.`,
          variant: "destructive"
        });
        return;
      }
      
      joinSessionMutation.mutate(sessionId);
    }
  };

  // Event join mutation (reuse from calendar)
  const eventJoinMutation = useMutation({
    mutationFn: async ({ eventId, isCurrentlyAttending }: { eventId: string; isCurrentlyAttending: boolean }) => {
      const url = isCurrentlyAttending ? `/api/events/${eventId}/leave` : `/api/events/${eventId}/join`;
      const method = isCurrentlyAttending ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: method === 'POST' ? JSON.stringify({ status: 'attending' }) : undefined,
      });
      if (!response.ok) throw new Error(`Failed to ${isCurrentlyAttending ? 'leave' : 'join'} event`);
      return response.json();
    },
    onSuccess: (_, { isCurrentlyAttending }) => {
      toast({ 
        title: isCurrentlyAttending ? "Left event successfully!" : "Joined event successfully!" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', 'game_pod', 'upcoming'] });
    },
    onError: (_, { isCurrentlyAttending }) => {
      toast({ 
        title: `Failed to ${isCurrentlyAttending ? 'leave' : 'join'} event`, 
        variant: "destructive" 
      });
    },
  });

  const handleJoinEvent = (eventId: string, isCurrentlyAttending: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join events.",
        variant: "destructive"
      });
      return;
    }
    
    eventJoinMutation.mutate({ eventId, isCurrentlyAttending });
  };

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: selectedCommunity 
          ? `linear-gradient(135deg, ${selectedCommunity.themeColor}15 0%, ${selectedCommunity.themeColor}05 100%)`
          : 'var(--background)'
      }}
    >
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section with New Branding */}
          <div className="text-center mb-12 space-y-6">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="@assets/9_1756664764439.png" 
                alt="TableSync Logo" 
                className="h-24 w-auto drop-shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-orange-500 to-purple-600 bg-clip-text text-transparent">
              TableSync
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Connect with players worldwide for remote TCG gameplay. Synchronize your card games across any distance with real-time coordination.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>Real-time Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span>Global Play</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span>All TCG Games</span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-gradient-to-r from-purple-100 to-orange-100 dark:from-purple-900 dark:to-orange-900">
              <TabsTrigger value="join" data-testid="tab-join-room" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                <i className="fas fa-users mr-2"></i>
                Join Room
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-room" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                <i className="fas fa-plus-circle mr-2"></i>
                Create Room
              </TabsTrigger>
            </TabsList>

            {/* Join Room Tab */}
            <TabsContent value="join" className="space-y-6">
              {isLoadingSessions || isLoadingEvents ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : gameSessions.length === 0 && gameEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <i className="fas fa-gamepad text-4xl text-muted-foreground mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">No Active Rooms or Events</h3>
                    <p className="text-muted-foreground mb-4">
                      No game rooms are currently available and no upcoming game pod events. Be the first to create one!
                    </p>
                    <Button onClick={() => setActiveTab("create")} data-testid="button-create-first-room">
                      Create First Room
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Active Game Sessions */}
                  {gameSessions.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Active Game Rooms</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {gameSessions.map((session) => (
                    <Card key={session.id} className="hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 border-2" data-testid={`card-room-${session.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{session.gameData?.name || 'Game Room'}</CardTitle>
                            <CardDescription>Hosted by {session.host?.firstName || session.host?.email}</CardDescription>
                          </div>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                            {session.currentPlayers}/{session.maxPlayers}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Format:</span>
                            <span className="font-medium">{session.gameData?.format || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Power Level:</span>
                            <span className="font-medium">{session.gameData?.powerLevel || 'Any'}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge variant="outline" className="text-xs capitalize">{session.status}</Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{session.gameData?.description || 'No description provided'}</p>
                        
                        <Button 
                          className="w-full" 
                          onClick={() => handleJoinRoom(session.id)}
                          disabled={session.currentPlayers >= session.maxPlayers || joinSessionMutation.isPending}
                          data-testid={`button-join-${session.id}`}
                        >
                          {joinSessionMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner animate-spin mr-2"></i>
                              Joining...
                            </>
                          ) : session.currentPlayers >= session.maxPlayers ? (
                            "Room Full"
                          ) : (
                            "Join Room"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                  {/* Upcoming Game Pod Events */}
                  {gameEvents.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Upcoming Game Pod Events</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {gameEvents.map((event: any) => (
                          <Card key={event.id} className="hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 border-2" data-testid={`card-event-${event.id}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">{event.title}</CardTitle>
                                  <CardDescription>Hosted by {event.creator?.firstName || event.creator?.email}</CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  {event.attendeeCount || 0}/{event.maxAttendees || 4}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Time:</span>
                                  <span className="font-medium">{event.time}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Location:</span>
                                  <span className="font-medium">{event.location}</span>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">{event.description || 'No description provided'}</p>
                              
                              {user ? (
                                <Button 
                                  className="w-full" 
                                  onClick={() => handleJoinEvent(event.id, event.isUserAttending || false)}
                                  variant={event.isUserAttending ? "secondary" : "default"}
                                  data-testid={`button-join-event-${event.id}`}
                                >
                                  {event.isUserAttending ? "Leave Event" : "Join Event"}
                                </Button>
                              ) : (
                                <Button 
                                  className="w-full" 
                                  variant="outline"
                                  onClick={() => toast({ title: "Please log in to join events", variant: "destructive" })}
                                  data-testid={`button-login-event-${event.id}`}
                                >
                                  <i className="fas fa-sign-in-alt mr-2"></i>
                                  Login to Join
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}
            </TabsContent>

            {/* Create Room Tab */}
            <TabsContent value="create">
              <Card className="max-w-2xl mx-auto border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-950 dark:to-purple-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <i className="fas fa-gamepad text-white text-sm"></i>
                    </div>
                    <span className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                      Create New Game Room
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Set up a new TableSync room for remote gameplay with other TCG enthusiasts around the world
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      placeholder="Enter a descriptive room name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      data-testid="input-room-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="game-format">Game Format</Label>
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger data-testid="select-game-format">
                        <SelectValue placeholder="Select game format" />
                      </SelectTrigger>
                      <SelectContent>
                        {GAME_FORMATS.map((format) => (
                          <SelectItem key={format.id} value={format.id}>
                            {format.name} ({format.players})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-players">Max Players</Label>
                      <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                        <SelectTrigger data-testid="select-max-players">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Players</SelectItem>
                          <SelectItem value="3">3 Players</SelectItem>
                          <SelectItem value="4">4 Players</SelectItem>
                          <SelectItem value="5">5 Players</SelectItem>
                          <SelectItem value="6">6 Players</SelectItem>
                          <SelectItem value="8">8 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="power-level">Power Level</Label>
                      <Select value={powerLevel} onValueChange={setPowerLevel}>
                        <SelectTrigger data-testid="select-power-level">
                          <SelectValue placeholder="Select power level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual (1-4)</SelectItem>
                          <SelectItem value="focused">Focused (5-6)</SelectItem>
                          <SelectItem value="optimized">Optimized (7-8)</SelectItem>
                          <SelectItem value="competitive">Competitive (9-10)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Room Description</Label>
                    <Input
                      id="description"
                      placeholder="Describe your playstyle, deck restrictions, or anything players should know"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      data-testid="input-description"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleCreateRoom}
                    disabled={!roomName || !selectedFormat || createSessionMutation.isPending || !user}
                    data-testid="button-create-room"
                  >
                    {createSessionMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-2"></i>
                        Creating Room...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus-circle mr-2"></i>
                        Create Room
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}