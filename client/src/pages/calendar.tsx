import { useQuery, useMutation } from "@tanstack/react-query";
import { addMonths, subMonths, format } from "date-fns";
import React, { useState, useMemo, useCallback } from "react";
import type { Event, Community } from "@shared/schema";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { TodayEventCard } from "@/components/calendar/components/TodayEventCard";
import { UpcomingEventCard } from "@/components/calendar/components/UpcomingEventCard";
import { CSVUploadDialog } from "@/components/calendar/CSVUploadDialog";
import { EventFormDialog } from "@/components/calendar/forms/EventFormDialog";
import type { EventFormData } from "@/components/calendar/forms/eventFormSchema";
import { GraphicsGeneratorDialog } from "@/components/calendar/GraphicsGeneratorDialog";
import CalendarLoginPrompt from "@/components/CalendarLoginPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useCalendarWebSocket } from "@/features/events/hooks/useCalendarWebSocket";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/shared/components";

const EVENT_TYPES = [
  {
    id: "tournament",
    name: "Tournament",
    icon: "fas fa-trophy",
    color: "bg-yellow-500",
  },
  {
    id: "convention",
    name: "Convention",
    icon: "fas fa-building",
    color: "bg-purple-500",
  },
  {
    id: "release",
    name: "Product Release",
    icon: "fas fa-box",
    color: "bg-blue-500",
  },
  {
    id: "game_pod",
    name: "Game Pod",
    icon: "fas fa-gamepad",
    color: "bg-red-500",
  },
  {
    id: "community",
    name: "Community Event",
    icon: "fas fa-users",
    color: "bg-green-500",
  },
];

type ExtendedEvent = Event & {
  creator: unknown;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
  mainPlayers?: number;
  alternates?: number;
  // Properties that don&apos;t exist in schema but are used by legacy code
  // TODO: Update code to use startTime/endTime instead
  date?: string;
  time?: string;
};

export default function Calendar() {
  useDocumentTitle("Calendar");

  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedCommunity, communityTheme } = useCommunity();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState("month");
  const [filterType, setFilterType] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [isGraphicsOpen, setIsGraphicsOpen] = useState(false);
  const [selectedEventForGraphics, setSelectedEventForGraphics] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // State for editing events
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventData, setEditingEventData] = useState<
    Partial<EventFormData> | undefined
  >(undefined);

  // Fetch events for the selected community only
  const { data: events = [] } = useQuery<ExtendedEvent[]>({
    queryKey: [
      "/api/events",
      selectedCommunity?.id,
      filterType !== "all" ? filterType : "all",
      "upcoming",
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCommunity?.id)
        params.append("communityId", selectedCommunity.id);
      if (filterType !== "all") params.append("type", filterType);
      params.append("upcoming", "true");

      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: isAuthenticated && !!selectedCommunity, // Only fetch when authenticated and community selected
  });

  // Fetch communities - only for authenticated users
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Real-time WebSocket updates using custom hook
  // connectionStatus can be used to show connection indicator in UI
  const { connectionStatus: _wsConnectionStatus } = useCalendarWebSocket({
    isAuthenticated,
    selectedCommunity,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: unknown) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateDialogOpen(false);
      setEditingEventId(null);
      setEditingEventData(undefined);
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
    },
  });

  // Join event mutation
  const joinEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      isCurrentlyAttending,
    }: {
      eventId: string;
      isCurrentlyAttending: boolean;
    }) => {
      const url = isCurrentlyAttending
        ? `/api/events/${eventId}/leave`
        : `/api/events/${eventId}/join`;
      const method = isCurrentlyAttending ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:
          method === "POST"
            ? JSON.stringify({ status: "attending" })
            : undefined,
      });
      if (!response.ok)
        throw new Error(
          `Failed to ${isCurrentlyAttending ? "leave" : "join"} event`,
        );
      return response.json();
    },
    onSuccess: (_, { isCurrentlyAttending }) => {
      toast({
        title: isCurrentlyAttending
          ? "Left event successfully!"
          : "Joined event successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (_, { isCurrentlyAttending }) => {
      toast({
        title: `Failed to ${isCurrentlyAttending ? "leave" : "join"} event`,
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Record<string, unknown>) => {
      const { id, ...updateData } = eventData;
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update event");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateDialogOpen(false);
      setEditingEventId(null);
      setEditingEventData(undefined);
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete event");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Event deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const handleCreateEvent = (data: EventFormData) => {
    if (!selectedCommunity?.id) {
      toast({
        title: "Please select a community first",
        variant: "destructive",
      });
      return;
    }

    const eventData: Record<string, unknown> = {
      title: data.title,
      type: data.type,
      date: data.date,
      time: data.time,
      location: data.location,
      description: data.description,
      communityId: data.communityId || selectedCommunity.id,
    };

    // Add pod-specific fields if event type is game_pod
    if (data.type === "game_pod") {
      eventData.playerSlots = data.playerSlots;
      eventData.alternateSlots = data.alternateSlots;
      eventData.gameFormat = data.gameFormat;
      eventData.powerLevel = data.powerLevel;
    }

    if (editingEventId) {
      // Update existing event
      updateEventMutation.mutate({
        id: editingEventId,
        ...eventData,
      });
    } else {
      // Create new event
      createEventMutation.mutate(eventData);
    }
  };

  // Memoize handlers to maintain referential equality for memoized components
  const handleAttendEvent = useCallback(
    (eventId: string, isCurrentlyAttending: boolean) => {
      joinEventMutation.mutate({ eventId, isCurrentlyAttending });
    },
    [joinEventMutation],
  );

  const handleEditEventById = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      // Pre-populate form with existing event data
      setEditingEventData({
        title: event.title,
        type: event.type,
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        description: event.description || "",
        communityId: event.communityId || "",
        playerSlots: event.mainPlayers,
        alternateSlots: event.alternates,
        gameFormat: "", // Not stored separately in schema, would need to be extracted from description or stored separately
        powerLevel: 5, // Not stored separately in schema
      });
      setEditingEventId(event.id);
      setIsCreateDialogOpen(true);
    },
    [events],
  );

  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      if (
        confirm(
          "Are you sure you want to delete this event? This action cannot be undone.",
        )
      ) {
        deleteEventMutation.mutate(eventId);
      }
    },
    [deleteEventMutation],
  );

  const handleGenerateGraphics = useCallback(
    (eventId: string, eventTitle: string) => {
      setSelectedEventForGraphics({ id: eventId, title: eventTitle });
      setIsGraphicsOpen(true);
    },
    [],
  );

  const handleLoginRequired = useCallback(() => {
    toast({
      title: "Please log in to join events",
      variant: "destructive",
    });
  }, [toast]);

  // Memoize filtered events to avoid recalculation on every render
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterType !== "all" && event.type !== filterType) return false;
      return true;
    });
  }, [events, filterType]);

  // Memoize today's date calculation
  const todayDate = useMemo(() => {
    return new Date().toISOString().split("T")[0] ?? "";
  }, []);

  // Memoize today's events
  const todaysEvents = useMemo(() => {
    return events.filter((event) => event.date && event.date === todayDate);
  }, [events, todayDate]);

  // Memoize upcoming events
  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => event.date && event.date > todayDate)
      .slice(0, 5);
  }, [events, todayDate]);

  // Show login prompt for unauthenticated users (after all hooks are called)
  if (!isLoading && !isAuthenticated) {
    return <CalendarLoginPrompt />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

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
                Stay updated with tournaments, conventions, releases, and
                community events
              </p>
              {selectedCommunity && (
                <div className="flex items-center space-x-2 mt-4">
                  <Badge
                    className="flex items-center space-x-2 px-3 py-1"
                    style={{
                      backgroundColor: selectedCommunity.themeColor + "20",
                      color: selectedCommunity.themeColor,
                      borderColor: selectedCommunity.themeColor,
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
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCSVUploadOpen(true)}
                  disabled={!selectedCommunity}
                >
                  <i className="fas fa-file-csv mr-2"></i>
                  Bulk Upload
                </Button>
                <EventFormDialog
                  isOpen={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                  onSubmit={handleCreateEvent}
                  editingEventId={editingEventId}
                  communities={communities}
                  eventTypes={EVENT_TYPES}
                  selectedCommunityId={selectedCommunity?.id}
                  defaultValues={editingEventData}
                  isSubmitting={
                    createEventMutation.isPending ||
                    updateEventMutation.isPending
                  }
                />
              </div>
            </div>
          </div>

          {/* CSV Upload Dialog */}
          {selectedCommunity && (
            <CSVUploadDialog
              isOpen={isCSVUploadOpen}
              onClose={() => setIsCSVUploadOpen(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/events"] });
              }}
              communityId={selectedCommunity.id}
            />
          )}

          {/* Graphics Generator Dialog */}
          {selectedEventForGraphics && (
            <GraphicsGeneratorDialog
              isOpen={isGraphicsOpen}
              onClose={() => {
                setIsGraphicsOpen(false);
                setSelectedEventForGraphics(null);
              }}
              eventId={selectedEventForGraphics.id}
              eventTitle={selectedEventForGraphics.title}
            />
          )}

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Overview
              </TabsTrigger>
              <TabsTrigger value="calendar" data-testid="tab-calendar">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="my-events" data-testid="tab-my-events">
                My Events
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Today's Events */}
              <div>
                <h2 className="text-2xl font-bold mb-4 community-heading">
                  Today&apos;s {communityTheme.terminology.events}
                </h2>
                {todaysEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {todaysEvents.map((event) => {
                      const eventType = EVENT_TYPES.find(
                        (t) => t.id === event.type,
                      );
                      return (
                        <TodayEventCard
                          key={event.id}
                          event={event}
                          eventType={eventType}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <i className="fas fa-calendar-day text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">
                        No events scheduled for today
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Upcoming Events */}
              <div>
                <h2 className="text-2xl font-bold mb-4 community-heading">
                  Upcoming {communityTheme.terminology.events}
                </h2>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const eventType = EVENT_TYPES.find(
                      (t) => t.id === event.type,
                    );
                    return (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        eventType={eventType}
                        user={user}
                        onEdit={handleEditEventById}
                        onDelete={handleDeleteEvent}
                        onJoinLeave={handleAttendEvent}
                        onGenerateGraphics={handleGenerateGraphics}
                        onLoginRequired={handleLoginRequired}
                      />
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <div className="space-y-6">
                {/* Filters */}
                <CalendarFilters
                  filterType={filterType}
                  onFilterTypeChange={setFilterType}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  eventTypes={EVENT_TYPES}
                  communityName={selectedCommunity?.name}
                  eventsTerminology={communityTheme.terminology.events}
                />

                {/* Calendar Grid */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {communityTheme.terminology.events} Calendar
                    </CardTitle>
                    <CalendarHeader
                      currentDate={currentMonth}
                      onPreviousMonth={() =>
                        setCurrentMonth(subMonths(currentMonth, 1))
                      }
                      onNextMonth={() =>
                        setCurrentMonth(addMonths(currentMonth, 1))
                      }
                      onToday={() => setCurrentMonth(new Date())}
                    />
                  </CardHeader>
                  <CardContent>
                    <CalendarGrid
                      currentDate={currentMonth}
                      events={filteredEvents}
                      onDateClick={(_date) => {
                        // Could set selected date or open date view here
                        // Functionality not yet implemented
                      }}
                      onEventClick={(_event) => {
                        // Could open event details dialog here
                        // Functionality not yet implemented
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* My Events Tab */}
            <TabsContent value="my-events">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold community-heading">
                  My {communityTheme.terminology.events}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span>Attending</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {events
                        .filter((e) => e.isUserAttending)
                        .map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-3 border rounded-lg mb-2"
                          >
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.date
                                  ? new Date(event.date).toLocaleDateString()
                                  : format(
                                      new Date(event.startTime),
                                      "PPP",
                                    )}{" "}
                                at{" "}
                                {event.time ||
                                  (event.startTime &&
                                    format(new Date(event.startTime), "HH:mm"))}
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
                        <p className="text-muted-foreground mb-4">
                          You haven&apos;t created any events yet
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!selectedCommunity}
                          onClick={() => setIsCreateDialogOpen(true)}
                        >
                          <i className="fas fa-plus mr-2"></i>
                          Create Your First Event
                        </Button>
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
