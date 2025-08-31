import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/header";

const GAME_FORMATS = [
  { id: "commander", name: "Commander/EDH", players: "2-4 players" },
  { id: "standard", name: "Standard", players: "2 players" },
  { id: "modern", name: "Modern", players: "2 players" },
  { id: "legacy", name: "Legacy", players: "2 players" },
  { id: "draft", name: "Draft", players: "4-8 players" },
  { id: "sealed", name: "Sealed", players: "2-8 players" },
  { id: "casual", name: "Casual", players: "2-6 players" },
];

const ACTIVE_ROOMS = [
  {
    id: "room1",
    name: "Chill Commander Games",
    host: "CardMaster2024",
    format: "Commander/EDH",
    players: 3,
    maxPlayers: 4,
    powerLevel: "6-7",
    description: "Looking for fun, interactive games. No infinite combos please!",
    community: "Magic: The Gathering"
  },
  {
    id: "room2", 
    name: "Pokemon PTCG Live",
    host: "PikachuTrainer",
    format: "Standard",
    players: 1,
    maxPlayers: 2,
    powerLevel: "Competitive",
    description: "Testing new deck builds for upcoming tournament",
    community: "Pokemon"
  },
  {
    id: "room3",
    name: "Lorcana Story Time",
    host: "DisneyFan99",
    format: "Casual",
    players: 2,
    maxPlayers: 4,
    powerLevel: "Casual",
    description: "Friendly Lorcana games with story discussion!",
    community: "Lorcana"
  }
];

export default function TableSync() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [powerLevel, setPowerLevel] = useState("");
  const [description, setDescription] = useState("");

  const handleCreateRoom = () => {
    // TODO: Implement room creation logic
    console.log("Creating room:", { roomName, selectedFormat, maxPlayers, powerLevel, description });
  };

  const handleJoinRoom = (roomId: string) => {
    // TODO: Implement room joining logic
    console.log("Joining room:", roomId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              TableSync
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with players worldwide for remote TCG gameplay. Create or join game rooms across all your favorite card games.
            </p>
          </div>

          <Tabs defaultValue="join" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="join" data-testid="tab-join-room">Join Room</TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-room">Create Room</TabsTrigger>
            </TabsList>

            {/* Join Room Tab */}
            <TabsContent value="join" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {ACTIVE_ROOMS.map((room) => (
                  <Card key={room.id} className="hover:border-primary/50 transition-colors" data-testid={`card-room-${room.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <CardDescription>Hosted by {room.host}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          {room.players}/{room.maxPlayers}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Format:</span>
                          <span className="font-medium">{room.format}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Power Level:</span>
                          <span className="font-medium">{room.powerLevel}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Community:</span>
                          <Badge variant="outline" className="text-xs">{room.community}</Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{room.description}</p>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.players >= room.maxPlayers}
                        data-testid={`button-join-${room.id}`}
                      >
                        {room.players >= room.maxPlayers ? "Room Full" : "Join Room"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Create Room Tab */}
            <TabsContent value="create">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Create New Game Room</CardTitle>
                  <CardDescription>
                    Set up a new room for remote gameplay with other TCG enthusiasts
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
                    disabled={!roomName || !selectedFormat}
                    data-testid="button-create-room"
                  >
                    Create Room
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