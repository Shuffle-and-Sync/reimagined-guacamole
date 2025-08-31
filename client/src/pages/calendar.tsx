import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/header";

const EVENT_TYPES = [
  { id: "tournament", name: "Tournament", icon: "fas fa-trophy", color: "bg-yellow-500" },
  { id: "convention", name: "Convention", icon: "fas fa-building", color: "bg-purple-500" },
  { id: "release", name: "Product Release", icon: "fas fa-box", color: "bg-blue-500" },
  { id: "stream", name: "Stream Session", icon: "fas fa-video", color: "bg-red-500" },
  { id: "community", name: "Community Event", icon: "fas fa-users", color: "bg-green-500" },
  { id: "personal", name: "Personal Game", icon: "fas fa-gamepad", color: "bg-indigo-500" }
];

const UPCOMING_EVENTS = [
  {
    id: "event1",
    title: "Magic: The Gathering Pro Tour",
    type: "tournament",
    date: "2024-09-15",
    time: "10:00",
    location: "Las Vegas, NV",
    community: "Magic: The Gathering",
    description: "The biggest MTG tournament of the year featuring the best players worldwide.",
    attendees: 1247,
    isAttending: false
  },
  {
    id: "event2",
    title: "Pokemon World Championships",
    type: "tournament", 
    date: "2024-09-22",
    time: "09:00",
    location: "Yokohama, Japan",
    community: "Pokemon",
    description: "The ultimate Pokemon TCG competition determining the world champion.",
    attendees: 2156,
    isAttending: true
  },
  {
    id: "event3",
    title: "Weekly Commander Night",
    type: "community",
    date: "2024-09-01",
    time: "19:00", 
    location: "Local Game Store",
    community: "Magic: The Gathering",
    description: "Casual Commander games with the local community. All skill levels welcome!",
    attendees: 24,
    isAttending: true
  },
  {
    id: "event4",
    title: "Lorcana: Into the Inklands Release",
    type: "release",
    date: "2024-09-08",
    time: "00:00",
    location: "Worldwide",
    community: "Lorcana",
    description: "New Lorcana set release featuring characters from The Lion King and more!",
    attendees: 5432,
    isAttending: false
  },
  {
    id: "event5",
    title: "Gen Con 2024",
    type: "convention",
    date: "2024-08-31",
    time: "09:00",
    location: "Indianapolis, IN",
    community: "All",
    description: "The largest tabletop gaming convention in North America.",
    attendees: 60000,
    isAttending: false
  }
];

export default function Calendar() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState("month");
  const [filterType, setFilterType] = useState("all");
  const [filterCommunity, setFilterCommunity] = useState("all");

  // Event creation form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");

  const handleCreateEvent = () => {
    // TODO: Implement event creation logic
    console.log("Creating event:", {
      title: newEventTitle,
      type: newEventType,
      date: newEventDate,
      time: newEventTime,
      location: newEventLocation,
      description: newEventDescription
    });
  };

  const handleAttendEvent = (eventId: string) => {
    // TODO: Implement event attendance logic
    console.log("Attending event:", eventId);
  };

  const filteredEvents = UPCOMING_EVENTS.filter(event => {
    if (filterType !== "all" && event.type !== filterType) return false;
    if (filterCommunity !== "all" && event.community !== filterCommunity) return false;
    return true;
  });

  const todaysEvents = UPCOMING_EVENTS.filter(event => event.date === new Date().toISOString().split('T')[0]);
  const upcomingEvents = UPCOMING_EVENTS.filter(event => event.date > new Date().toISOString().split('T')[0]).slice(0, 5);

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
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-event">
                  <i className="fas fa-plus mr-2"></i>
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
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
                      <Label htmlFor="event-location">Location</Label>
                      <Input
                        id="event-location"
                        placeholder="Event location or 'Online'"
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        data-testid="input-event-location"
                      />
                    </div>
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
                    <Button variant="outline">Cancel</Button>
                    <Button 
                      onClick={handleCreateEvent}
                      disabled={!newEventTitle || !newEventType || !newEventDate}
                      data-testid="button-submit-event"
                    >
                      Create Event
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                <h2 className="text-2xl font-bold mb-4">Today's Events</h2>
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
                                <Badge variant="outline">{event.community}</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{event.time}</span>
                            </div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                            <div className="flex items-center justify-between text-sm">
                              <span>📍 {event.location}</span>
                              <span>👥 {event.attendees.toLocaleString()}</span>
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
                <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
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
                                  <Badge variant="outline">{event.community}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <div className="font-medium">{event.attendees.toLocaleString()}</div>
                                <div className="text-muted-foreground">attending</div>
                              </div>
                              <Button
                                variant={event.isAttending ? "secondary" : "default"}
                                size="sm"
                                onClick={() => handleAttendEvent(event.id)}
                                data-testid={`button-attend-${event.id}`}
                              >
                                {event.isAttending ? "Attending" : "Attend"}
                              </Button>
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

                    <Select value={filterCommunity} onValueChange={setFilterCommunity}>
                      <SelectTrigger className="w-48" data-testid="select-filter-community">
                        <SelectValue placeholder="Filter by community" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Communities</SelectItem>
                        <SelectItem value="Magic: The Gathering">Magic: The Gathering</SelectItem>
                        <SelectItem value="Pokemon">Pokemon</SelectItem>
                        <SelectItem value="Lorcana">Lorcana</SelectItem>
                        <SelectItem value="Yu-Gi-Oh">Yu-Gi-Oh</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <CardTitle>Event Calendar - {viewMode === "month" ? "Month" : "Week"} View</CardTitle>
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
                                <Badge variant="outline" className="text-xs">{event.community}</Badge>
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
                <h2 className="text-2xl font-bold">My Events</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span>Attending</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {UPCOMING_EVENTS.filter(e => e.isAttending).map((event) => (
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
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