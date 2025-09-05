import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { Header } from "@/shared/components";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Community } from "@shared/schema";

const EVENT_TYPES = [
  { id: "tournament", name: "Tournament", icon: "fas fa-trophy", color: "bg-yellow-500" },
  { id: "convention", name: "Convention", icon: "fas fa-building", color: "bg-purple-500" },
  { id: "release", name: "Product Release", icon: "fas fa-box", color: "bg-blue-500" },
  { id: "game_pod", name: "Game Pod", icon: "fas fa-gamepad", color: "bg-red-500" },
  { id: "community", name: "Community Event", icon: "fas fa-users", color: "bg-green-500" }
];

type ExtendedEvent = Event & { 
  creator: any; 
  community: Community | null; 
  attendeeCount: number; 
  isUserAttending?: boolean; 
};

export default function Calendar() {
  useDocumentTitle("Calendar");
  
  const { user } = useAuth();
  const { selectedCommunity, communityTheme } = useCommunity();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState("month");
  const [filterType, setFilterType] = useState("all");
  // Removed filterCommunity since events are automatically filtered by selected community
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Auto-set community when creating new events
  useEffect(() => {
    if (selectedCommunity) {
      setNewEventCommunityId(selectedCommunity.id);
    }
  }, [selectedCommunity]);

  // Event creation form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventCommunityId, setNewEventCommunityId] = useState("");

  // Fetch events for the selected community only
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useQuery<ExtendedEvent[]>({
    queryKey: ['/api/events', selectedCommunity?.id, filterType !== 'all' ? filterType : 'all', 'upcoming'],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCommunity?.id) params.append('communityId', selectedCommunity.id);
      if (filterType !== 'all') params.append('type', filterType);
      params.append('upcoming', 'true');
      
      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!selectedCommunity, // Allow viewing events without authentication
  });

  // Fetch communities
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateDialogOpen(false);
      setEditingEventId(null);
      // Reset form
      setNewEventTitle("");
      setNewEventType("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventLocation("");
      setNewEventDescription("");
      setNewEventCommunityId("");
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  // Join event mutation
  const joinEventMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (_, { isCurrentlyAttending }) => {
      toast({ 
        title: `Failed to ${isCurrentlyAttending ? 'leave' : 'join'} event`, 
        variant: "destructive" 
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const { id, ...updateData } = eventData;
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update event');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateDialogOpen(false);
      setEditingEventId(null);
      // Reset form
      setNewEventTitle("");
      setNewEventType("");
      setNewEventDate("");
      setNewEventTime("");
      setNewEventLocation("");
      setNewEventDescription("");
      setNewEventCommunityId("");
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const handleCreateEvent = () => {
    if (!newEventTitle || !newEventType || !newEventDate || !newEventTime || !newEventLocation) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!selectedCommunity?.id) {
      toast({ title: "Please select a community first", variant: "destructive" });
      return;
    }

    if (editingEventId) {
      // Update existing event
      updateEventMutation.mutate({
        id: editingEventId,
        title: newEventTitle,
        type: newEventType,
        date: newEventDate,
        time: newEventTime,
        location: newEventLocation,
        description: newEventDescription,
        communityId: selectedCommunity.id,
      });
    } else {
      // Create new event
      createEventMutation.mutate({
        title: newEventTitle,
        type: newEventType,
        date: newEventDate,
        time: newEventTime,
        location: newEventLocation,
        description: newEventDescription,
        communityId: selectedCommunity.id, // Auto-set to current community
      });
    }
  };

  const handleAttendEvent = (eventId: string, isCurrentlyAttending: boolean) => {
    joinEventMutation.mutate({ eventId, isCurrentlyAttending });
  };

  const handleEditEvent = (event: ExtendedEvent) => {
    // Pre-populate form with existing event data
    setNewEventTitle(event.title);
    setNewEventType(event.type);
    setNewEventDate(event.date);
    setNewEventTime(event.time);
    setNewEventLocation(event.location);
    setNewEventDescription(event.description || '');
    setNewEventCommunityId(event.communityId || '');
    setEditingEventId(event.id);
    setIsCreateDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Add state for editing
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Events are already filtered by community in the API query, just filter by type
  const filteredEvents = events.filter(event => {
    if (filterType !== "all" && event.type !== filterType) return false;
    return true;
  });

  const todaysEvents = events.filter(event => event.date === new Date().toISOString().split('T')[0]);
  const upcomingEvents = events.filter(event => event.date > new Date().toISOString().split('T')[0]).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold gradient-text">
                Event Calendar
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                Stay updated with tournaments, conventions, releases, and community events
              </p>
              {selectedCommunity && (
                <div className="flex items-center space-x-2 mt-4">
                  <Badge 
                    className="flex items-center space-x-2 px-3 py-1"
                    style={{ 
                      backgroundColor: selectedCommunity.themeColor + '20',
                      color: selectedCommunity.themeColor,
                      borderColor: selectedCommunity.themeColor 
                    }}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: selectedCommunity.themeColor }}
                    ></div>
                    <span>Filtering by {selectedCommunity.displayName}</span>
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              {!selectedCommunity && (
                <p className="text-sm text-muted-foreground">
                  Select a specific realm to create events
                </p>
              )}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    data-testid="button-create-event"
                    disabled={!selectedCommunity}
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Event
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingEventId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                  <DialogDescription>
                    Schedule a new gaming event, tournament, or community gathering
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="event-title">Event Title</Label>
                    <Input
                      id="event-title"
                      placeholder="Enter event title"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      data-testid="input-event-title"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-type">Event Type</Label>
                      <Select value={newEventType} onValueChange={setNewEventType}>
                        <SelectTrigger data-testid="select-event-type">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EVENT_TYPES.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center space-x-2">
                                <i className={`${type.icon} text-sm`}></i>
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-community">Community</Label>
                      <Select value={newEventCommunityId} onValueChange={setNewEventCommunityId}>
                        <SelectTrigger data-testid="select-event-community">
                          <SelectValue placeholder="Select community (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific community</SelectItem>
                          {communities.map((community) => (
                            <SelectItem key={community.id} value={community.id}>{community.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-location">Location</Label>
                    <Input
                      id="event-location"
                      placeholder="Event location or 'Online'"
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      data-testid="input-event-location"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-date">Date</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        data-testid="input-event-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-time">Time</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        data-testid="input-event-time"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-description">Description</Label>
                    <Textarea
                      id="event-description"
                      placeholder="Describe the event, rules, format, prizes, etc."
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      data-testid="textarea-event-description"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-event">Cancel</Button>
                    <Button 
                      onClick={handleCreateEvent}
                      disabled={!newEventTitle || !newEventType || !newEventDate || !selectedCommunity}
                      data-testid="button-submit-event"
                    >
                      {editingEventId ? 'Update Event' : 'Create Event'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
              <TabsTrigger value="my-events" data-testid="tab-my-events">My Events</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Today's Events */}
              <div>
                <h2 className="text-2xl font-bold mb-4 community-heading">Today's {communityTheme.terminology.events}</h2>
                {todaysEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaysEvents.map((event) => {
                      const eventType = EVENT_TYPES.find(t => t.id === event.type);
                      return (
                        <Card key={event.id} className="border-l-4 border-l-orange-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-8 h-8 ${eventType?.color} rounded-lg flex items-center justify-center`}>
                                  <i className={`${eventType?.icon} text-white text-sm`}></i>
                                </div>
                                <Badge variant="outline">{event.community?.name || 'All Communities'}</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{event.time}</span>
                            </div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span>📍 {event.location}</span>
                              <span>👥 {event.attendeeCount?.toLocaleString() || '0'}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <i className="fas fa-calendar-day text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">No events scheduled for today</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Events */}
              <div>
                <h2 className="text-2xl font-bold mb-4 community-heading">Upcoming {communityTheme.terminology.events}</h2>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const eventType = EVENT_TYPES.find(t => t.id === event.type);
                    return (
                      <Card key={event.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-12 h-12 ${eventType?.color} rounded-lg flex items-center justify-center`}>
                                <i className={`${eventType?.icon} text-white text-lg`}></i>
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                                  <span>🕒 {event.time}</span>
                                  <span>📍 {event.location}</span>
                                  <Badge variant="outline">{event.community?.name || 'All Communities'}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <div className="font-medium">{event.attendeeCount?.toLocaleString() || '0'}</div>
                                <div className="text-muted-foreground">attending</div>
                              </div>
                              <div className="flex space-x-2">
                                {user && (user.id === event.creator?.id || user.id === event.hostId) && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditEvent(event)}
                                      data-testid={`button-edit-${event.id}`}
                                    >
                                      <i className="fas fa-edit mr-2"></i>
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteEvent(event.id)}
                                      data-testid={`button-delete-${event.id}`}
                                    >
                                      <i className="fas fa-trash mr-2"></i>
                                      Delete
                                    </Button>
                                  </>
                                )}
                                {user ? (
                                  <Button
                                    variant={event.isUserAttending ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => handleAttendEvent(event.id, event.isUserAttending || false)}
                                    data-testid={`button-attend-${event.id}`}
                                  >
                                    {event.isUserAttending ? "Leave Event" : "Join Event"}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toast({ title: "Please log in to join events", variant: "destructive" })}
                                    data-testid={`button-login-required-${event.id}`}
                                  >
                                    <i className="fas fa-sign-in-alt mr-2"></i>
                                    Login to Join
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-48" data-testid="select-filter-type">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border">
                      <span className="font-medium">{selectedCommunity?.name || 'Unknown Community'}</span> {communityTheme.terminology.events}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "week" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("week")}
                    >
                      Week
                    </Button>
                    <Button
                      variant={viewMode === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("month")}
                    >
                      Month
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle>{communityTheme.terminology.events} Calendar - {viewMode === "month" ? "Month" : "Week"} View</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredEvents.map((event) => {
                        const eventType = EVENT_TYPES.find(t => t.id === event.type);
                        return (
                          <Card key={event.id} className="border-l-4" style={{borderLeftColor: eventType?.color.replace('bg-', '#')}}>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className={`w-6 h-6 ${eventType?.color} rounded flex items-center justify-center`}>
                                  <i className={`${eventType?.icon} text-white text-xs`}></i>
                                </div>
                                <Badge variant="outline" className="text-xs">{event.community?.name || 'All Communities'}</Badge>
                              </div>
                              <h4 className="font-semibold text-sm mb-1">{event.title}</h4>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <div>📅 {new Date(event.date).toLocaleDateString()}</div>
                                <div>🕒 {event.time}</div>
                                <div>📍 {event.location}</div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Events Tab */}
            <TabsContent value="my-events">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold community-heading">My {communityTheme.terminology.events}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span>Attending</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {events.filter(e => e.isUserAttending).map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </div>
                          </div>
                          <Badge variant="secondary">Attending</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-calendar-plus text-primary"></i>
                        <span>Created by Me</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <i className="fas fa-calendar-day text-4xl text-muted-foreground mb-4"></i>
                        <p className="text-muted-foreground mb-4">You haven't created any events yet</p>
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={!selectedCommunity}
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Create Your First Event
                            </Button>
                          </DialogTrigger>
                        </Dialog>
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