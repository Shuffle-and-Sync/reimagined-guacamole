import React, { useState, useEffect, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MatchmakingPreferences } from "@shared/schema";
import { Header } from "@/shared/components";
import { useCommunity } from "@/features/communities";

const GAME_FORMATS = [
  { id: "commander", name: "Commander/EDH", game: "MTG" },
  { id: "standard", name: "Standard", game: "MTG" },
  { id: "modern", name: "Modern", game: "MTG" },
  { id: "legacy", name: "Legacy", game: "MTG" },
  { id: "draft", name: "Draft", game: "MTG" },
  { id: "pokemon-standard", name: "Standard", game: "Pokemon" },
  { id: "pokemon-expanded", name: "Expanded", game: "Pokemon" },
  { id: "lorcana-constructed", name: "Constructed", game: "Lorcana" },
  { id: "yugioh-advanced", name: "Advanced", game: "Yu-Gi-Oh" },
];

const SUGGESTED_PLAYERS = [
  {
    id: "player1",
    username: "CommanderCrafter",
    avatar: null,
    games: ["MTG"],
    formats: ["Commander/EDH"],
    powerLevel: 7,
    playstyle: "Focused",
    location: "Seattle, WA",
    availability: "Evenings",
    matchScore: 95,
    commonInterests: [
      "Tribal decks",
      "Interactive games",
      "No infinite combos",
    ],
    lastOnline: "2 hours ago",
    isOnline: true,
  },
  {
    id: "player2",
    username: "PokeMaster2024",
    avatar: null,
    games: ["Pokemon"],
    formats: ["Standard", "Expanded"],
    powerLevel: 8,
    playstyle: "Competitive",
    location: "Austin, TX",
    availability: "Weekends",
    matchScore: 87,
    commonInterests: ["Meta decks", "Tournament prep", "Theory crafting"],
    lastOnline: "30 minutes ago",
    isOnline: true,
  },
  {
    id: "player3",
    username: "LorcanaLore",
    avatar: null,
    games: ["Lorcana"],
    formats: ["Constructed"],
    powerLevel: 5,
    playstyle: "Casual",
    location: "Online Only",
    availability: "Flexible",
    matchScore: 92,
    commonInterests: ["Disney lore", "Story discussions", "Deck building"],
    lastOnline: "1 day ago",
    isOnline: false,
  },
  {
    id: "player4",
    username: "YuGiOhVet",
    avatar: null,
    games: ["Yu-Gi-Oh"],
    formats: ["Advanced"],
    powerLevel: 9,
    playstyle: "Competitive",
    location: "New York, NY",
    availability: "Daily",
    matchScore: 78,
    commonInterests: ["Meta analysis", "Combo decks", "Tournament play"],
    lastOnline: "Online now",
    isOnline: true,
  },
];

export default function Matchmaking() {
  useDocumentTitle("Matchmaking");

  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity, _communityTheme } = useCommunity();

  // Matchmaking preferences
  const [selectedGames, setSelectedGames] = useState<string[]>(["MTG"]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    "commander",
  ]);
  const [powerLevelRange, setPowerLevelRange] = useState([5, 8]);
  const [playstyle, setPlaystyle] = useState("any");
  const [location, setLocation] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [availability, setAvailability] = useState("any");
  const [_language, setLanguage] = useState("english");

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Fetch user's matchmaking preferences
  const { data: savedPreferences, isLoading: _preferencesLoading } =
    useQuery<MatchmakingPreferences>({
      queryKey: ["/api/matchmaking/preferences"],
      enabled: !!user?.id,
    });

  // Load saved preferences when available
  useEffect(() => {
    if (savedPreferences) {
      // Use a microtask to avoid cascading renders
      queueMicrotask(() => {
        // Parse JSON fields
        const preferredFormats = savedPreferences.preferredFormats
          ? typeof savedPreferences.preferredFormats === "string"
            ? JSON.parse(savedPreferences.preferredFormats)
            : savedPreferences.preferredFormats
          : [];

        const skillLevelRange = savedPreferences.skillLevelRange
          ? typeof savedPreferences.skillLevelRange === "string"
            ? JSON.parse(savedPreferences.skillLevelRange)
            : savedPreferences.skillLevelRange
          : [1, 10];

        const availabilitySchedule = savedPreferences.availabilitySchedule
          ? typeof savedPreferences.availabilitySchedule === "string"
            ? JSON.parse(savedPreferences.availabilitySchedule)
            : savedPreferences.availabilitySchedule
          : {};

        // Note: selectedGames is not in schema, using gameType instead
        setSelectedGames([savedPreferences.gameType || "MTG"]);
        setSelectedFormats(
          preferredFormats.length > 0 ? preferredFormats : ["commander"],
        );
        setPowerLevelRange(
          Array.isArray(skillLevelRange) && skillLevelRange.length === 2
            ? skillLevelRange
            : [1, 10],
        );
        setPlaystyle(savedPreferences.playStyle || "any");
        setLocation(savedPreferences.preferredLocation || "");
        // Note: onlineOnly is not in schema
        setOnlineOnly(false);
        // Convert availabilitySchedule object to a simple string for the UI
        setAvailability(availabilitySchedule.general || "any");
        // Note: language is not in matchmaking preferences schema
        setLanguage("english");
      });
    }
  }, [savedPreferences]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (preferencesData: any) => {
      const response = await apiRequest(
        "PUT",
        "/api/matchmaking/preferences",
        preferencesData,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your matchmaking preferences have been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/matchmaking/preferences"],
      });
    },
  });

  // Find players mutation
  const findPlayersMutation = useMutation({
    mutationFn: async (searchPreferences: any) => {
      const response = await apiRequest(
        "POST",
        "/api/matchmaking/find-players",
        searchPreferences,
      );
      return response.json();
    },
    onSuccess: (matches) => {
      setSearchResults(matches);
      setIsSearching(false);
      toast({
        title: "Players found!",
        description: `Found ${matches.length} compatible players for you.`,
      });
    },
    onError: (error: any) => {
      setIsSearching(false);
      toast({
        title: "Search failed",
        description: error.message || "Failed to find matching players",
        variant: "destructive",
      });
    },
  });

  const handleStartMatching = useCallback(() => {
    setIsSearching(true);

    const searchPreferences = {
      gameType: selectedGames[0] || "MTG",
      preferredFormats: JSON.stringify(selectedFormats),
      skillLevelRange: JSON.stringify(powerLevelRange),
      playStyle: playstyle,
      preferredLocation: location,
      availabilitySchedule: JSON.stringify({ general: availability }),
      maxTravelDistance: 50,
    };

    // Save preferences and find matches
    savePreferencesMutation.mutate(searchPreferences);
    findPlayersMutation.mutate(searchPreferences);
  }, [
    selectedGames,
    selectedFormats,
    powerLevelRange,
    playstyle,
    location,
    availability,
    savePreferencesMutation,
    findPlayersMutation,
  ]);

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { playerId: string; message?: string }) => {
      const response = await apiRequest("POST", "/api/friend-requests", {
        addresseeId: data.playerId,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      const player = searchResults.find((p) => p.id === variables.playerId);
      toast({
        title: "Invite sent!",
        description: `Your game invite has been sent to ${player?.username || "this player"}. They'll receive a notification and can accept or decline.`,
      });
    },
  });

  const handleSendInvite = useCallback(
    (playerId: string) => {
      sendInviteMutation.mutate({ playerId });
    },
    [sendInviteMutation],
  );

  const handleMessagePlayer = useCallback(
    (playerId: string) => {
      const player = SUGGESTED_PLAYERS.find((p) => p.id === playerId);
      if (player) {
        toast({
          title: "Starting conversation",
          description: `Opening private message thread with ${player.username}...`,
        });

        // In a real app, this would navigate to a messaging interface
        // or open a chat modal with the selected player
        setTimeout(() => {
          toast({
            title: "Message feature",
            description:
              "Direct messaging will be available in the next update. For now, use the invite system to connect!",
          });
        }, 1000);
      }
    },
    [toast],
  );

  const toggleGame = useCallback((game: string) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game],
    );
  }, []);

  const _toggleFormat = useCallback((format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  }, []);

  const getInitials = useCallback((username: string) => {
    return username.substring(0, 2).toUpperCase();
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        background: selectedCommunity
          ? `linear-gradient(135deg, ${selectedCommunity.themeColor}15 0%, ${selectedCommunity.themeColor}05 100%)`
          : "var(--background)",
      }}
    >
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              AI Matchmaking
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find players with similar skill levels, playstyles, and interests.
              Our AI learns your preferences to suggest the perfect gaming
              partners.
            </p>
          </div>

          <Tabs defaultValue="find-players" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="find-players" data-testid="tab-find-players">
                Find Players
              </TabsTrigger>
              <TabsTrigger value="preferences" data-testid="tab-preferences">
                Preferences
              </TabsTrigger>
              <TabsTrigger value="connections" data-testid="tab-connections">
                Connections
              </TabsTrigger>
            </TabsList>

            {/* Find Players Tab */}
            <TabsContent value="find-players" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Match</CardTitle>
                    <CardDescription>
                      Set your preferences and find players instantly
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Games</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["MTG", "Pokemon", "Lorcana", "Yu-Gi-Oh"].map(
                          (game) => (
                            <div
                              key={game}
                              className={`p-2 rounded border cursor-pointer transition-all text-center text-sm ${
                                selectedGames.includes(game)
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                              onClick={() => toggleGame(game)}
                              data-testid={`game-${game.toLowerCase().replace(/[^a-z]/g, "")}`}
                            >
                              {game}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Power Level Range: {powerLevelRange[0]} -{" "}
                        {powerLevelRange[1]}
                      </Label>
                      <Slider
                        value={powerLevelRange}
                        onValueChange={setPowerLevelRange}
                        min={1}
                        max={10}
                        step={1}
                        className="w-full"
                        data-testid="slider-power-level"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1 (Casual)</span>
                        <span>10 (cEDH/Competitive)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="playstyle">Playstyle</Label>
                      <Select value={playstyle} onValueChange={setPlaystyle}>
                        <SelectTrigger data-testid="select-playstyle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Playstyle</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="focused">Focused</SelectItem>
                          <SelectItem value="optimized">Optimized</SelectItem>
                          <SelectItem value="competitive">
                            Competitive
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location (optional)</Label>
                      <Input
                        id="location"
                        placeholder="City, State or Online"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        data-testid="input-location"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="online-only"
                        checked={onlineOnly}
                        onCheckedChange={setOnlineOnly}
                        data-testid="switch-online-only"
                      />
                      <Label htmlFor="online-only" className="text-sm">
                        Online games only
                      </Label>
                    </div>

                    <Button
                      className="w-full"
                      onClick={handleStartMatching}
                      disabled={isSearching}
                      data-testid="button-start-matching"
                    >
                      {isSearching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Finding Players...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-search mr-2"></i>
                          Find Players
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Search Results */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      {isSearching
                        ? "Searching for players..."
                        : `${searchResults.length} Players Found`}
                    </h2>
                    {!isSearching && searchResults.length > 0 && (
                      <Select defaultValue="match-score">
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="match-score">
                            Best Match
                          </SelectItem>
                          <SelectItem value="online">Online Now</SelectItem>
                          <SelectItem value="recent">
                            Recently Active
                          </SelectItem>
                          <SelectItem value="location">Nearby</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {isSearching ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-muted rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/3"></div>
                                <div className="h-3 bg-muted rounded w-1/2"></div>
                                <div className="h-3 bg-muted rounded w-2/3"></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((player) => (
                        <Card
                          key={player.id}
                          className="hover:border-primary/50 transition-colors"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="relative">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage
                                      src={player.avatar || undefined}
                                    />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                      {getInitials(player.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  {player.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-background rounded-full"></div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      {player.username}
                                    </h3>
                                    <Badge className="bg-primary/20 text-primary">
                                      {player.matchScore}% Match
                                    </Badge>
                                    {player.isOnline && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                        Online
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <i className="fas fa-gamepad text-muted-foreground"></i>
                                        <span>
                                          {player.games.join(", ")} •{" "}
                                          {player.formats.join(", ")}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <i className="fas fa-chart-line text-muted-foreground"></i>
                                        <span>
                                          Power Level {player.powerLevel} •{" "}
                                          {player.playstyle}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <i className="fas fa-map-marker-alt text-muted-foreground"></i>
                                        <span>{player.location}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <i className="fas fa-clock text-muted-foreground"></i>
                                        <span>
                                          {player.availability} •{" "}
                                          {player.lastOnline}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3">
                                    <div className="text-sm text-muted-foreground mb-2">
                                      Common Interests:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {player.commonInterests.map(
                                        (interest: string, index: number) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {interest}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => handleSendInvite(player.id)}
                                  data-testid={`button-invite-${player.id}`}
                                >
                                  <i className="fas fa-plus mr-2"></i>
                                  Invite
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMessagePlayer(player.id)}
                                  data-testid={`button-message-${player.id}`}
                                >
                                  <i className="fas fa-comment mr-2"></i>
                                  Message
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="max-w-4xl mx-auto">
                <CardHeader>
                  <CardTitle>Matchmaking Preferences</CardTitle>
                  <CardDescription>
                    Set your detailed preferences to help our AI find the
                    perfect gaming partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Preferred Games</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Magic: The Gathering",
                            "Pokemon",
                            "Lorcana",
                            "Yu-Gi-Oh",
                            "Flesh and Blood",
                            "One Piece",
                          ].map((game) => (
                            <div
                              key={game}
                              className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">{game}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Preferred Formats</Label>
                        <div className="space-y-2">
                          {GAME_FORMATS.map((format) => (
                            <div
                              key={format.id}
                              className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">
                                {format.game}: {format.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label>Communication Preferences</Label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label className="text-sm">
                              Voice chat during games
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label className="text-sm">
                              Video chat for webcam games
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <Label className="text-sm">Text chat only</Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Availability</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Mornings",
                            "Afternoons",
                            "Evenings",
                            "Late Night",
                            "Weekends Only",
                            "Flexible",
                          ].map((time) => (
                            <div
                              key={time}
                              className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:border-primary/50 transition-colors"
                            >
                              <input type="checkbox" className="rounded" />
                              <span className="text-sm">{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pst">Pacific (PST)</SelectItem>
                            <SelectItem value="mst">Mountain (MST)</SelectItem>
                            <SelectItem value="cst">Central (CST)</SelectItem>
                            <SelectItem value="est">Eastern (EST)</SelectItem>
                            <SelectItem value="utc">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedGames(["MTG"]);
                        setSelectedFormats(["commander"]);
                        setPowerLevelRange([1, 10]);
                        setPlaystyle("any");
                        setLocation("");
                        setOnlineOnly(false);
                        setAvailability("any");
                        setLanguage("english");
                        toast({
                          title: "Preferences reset",
                          description:
                            "All matchmaking preferences have been reset to defaults.",
                        });
                      }}
                      data-testid="button-reset-preferences"
                    >
                      Reset to Defaults
                    </Button>
                    <Button
                      onClick={() => {
                        const preferencesData = {
                          gameType: selectedGames[0] || "MTG", // Schema requires single gameType, not array
                          preferredFormats: JSON.stringify(selectedFormats),
                          skillLevelRange: JSON.stringify(powerLevelRange),
                          playStyle: playstyle,
                          preferredLocation: location,
                          availabilitySchedule: JSON.stringify({
                            general: availability,
                          }),
                          maxTravelDistance: 50,
                        };
                        savePreferencesMutation.mutate(preferencesData);
                      }}
                      disabled={savePreferencesMutation.isPending}
                      data-testid="button-save-preferences"
                    >
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections">
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-users text-primary"></i>
                        <span>My Connections</span>
                      </CardTitle>
                      <CardDescription>
                        Players you&apos;ve connected with
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <i className="fas fa-user-friends text-4xl text-muted-foreground mb-4"></i>
                        <p className="text-muted-foreground mb-4">
                          No connections yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Use the matchmaking system to find and connect with
                          players
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-paper-plane text-secondary"></i>
                        <span>Pending Invites</span>
                      </CardTitle>
                      <CardDescription>
                        Invites you&apos;ve sent and received
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm font-medium">Sent (2)</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>CM</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">CommanderCrafter</span>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>PM</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">PokeMaster2024</span>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                        </div>

                        <Separator />

                        <div className="text-sm font-medium">Received (1)</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>DT</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  DragonTamer
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Wants to play Commander
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // TODO: Accept invite functionality
                                  toast({
                                    title:
                                      "Invite accepted! You can now connect with DragonTamer.",
                                  });
                                }}
                                data-testid="button-accept-invite"
                              >
                                <i className="fas fa-check mr-1"></i>
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: Decline invite functionality
                                  toast({
                                    title: "Invite declined.",
                                    variant: "destructive",
                                  });
                                }}
                                data-testid="button-decline-invite"
                              >
                                <i className="fas fa-times mr-1"></i>
                                Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
