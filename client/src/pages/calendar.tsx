import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { Community } from "@shared/schema";
import { CalendarDialogs } from "@/components/calendar/CalendarDialogs";
import { CalendarPageHeader } from "@/components/calendar/CalendarPageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import { EventsOverviewSection } from "@/components/calendar/EventsOverviewSection";
import { MyEventsTab } from "@/components/calendar/MyEventsTab";
import { EVENT_TYPES } from "@/components/calendar/types";
import CalendarLoginPrompt from "@/components/CalendarLoginPrompt";
import { SkipLink } from "@/components/SkipLink";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useCalendarHandlers } from "@/hooks/useCalendarHandlers";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header } from "@/shared/components";

export default function Calendar() {
  useDocumentTitle("Calendar");

  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedCommunity, communityTheme } = useCommunity();
  const [viewMode, setViewMode] = useState("month");
  const [filterType, setFilterType] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch events and handle mutations
  const {
    events,
    todaysEvents,
    upcomingEvents,
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    joinEventMutation,
  } = useCalendarEvents({
    isAuthenticated,
    selectedCommunity,
    filterType,
  });

  // Handle event actions and dialog states
  const {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isCSVUploadOpen,
    setIsCSVUploadOpen,
    isGraphicsOpen,
    setIsGraphicsOpen,
    selectedEventForGraphics,
    setSelectedEventForGraphics,
    editingEventId,
    editingEventData,
    handleCreateEvent,
    handleEditEventById,
    handleDeleteEvent,
    handleAttendEvent,
    handleGenerateGraphics,
    handleLoginRequired,
    isSubmitting,
  } = useCalendarHandlers({
    events,
    selectedCommunity,
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    joinEventMutation,
  });

  // Fetch communities - only for authenticated users
  const { data: communities = [] } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: isAuthenticated,
  });

  // Show login prompt for unauthenticated users
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
      <SkipLink />
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <CalendarPageHeader
            selectedCommunity={selectedCommunity}
            isCreateDialogOpen={isCreateDialogOpen}
            onCreateDialogOpenChange={setIsCreateDialogOpen}
            onCSVUploadClick={() => setIsCSVUploadOpen(true)}
            onEventSubmit={handleCreateEvent}
            editingEventId={editingEventId}
            communities={communities}
            eventTypes={EVENT_TYPES}
            editingEventData={editingEventData}
            isSubmitting={isSubmitting}
          />

          {/* Dialogs */}
          <CalendarDialogs
            selectedCommunityId={selectedCommunity?.id}
            isCSVUploadOpen={isCSVUploadOpen}
            onCSVUploadClose={() => setIsCSVUploadOpen(false)}
            isGraphicsOpen={isGraphicsOpen}
            onGraphicsClose={() => {
              setIsGraphicsOpen(false);
              setSelectedEventForGraphics(null);
            }}
            selectedEventForGraphics={selectedEventForGraphics}
          />

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
              <EventsOverviewSection
                todaysEvents={todaysEvents}
                upcomingEvents={upcomingEvents}
                eventTypes={EVENT_TYPES}
                user={user}
                eventsTerminology={communityTheme.terminology.events}
                onEdit={handleEditEventById}
                onDelete={handleDeleteEvent}
                onJoinLeave={handleAttendEvent}
                onGenerateGraphics={handleGenerateGraphics}
                onLoginRequired={handleLoginRequired}
              />
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <CalendarView
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                filterType={filterType}
                onFilterTypeChange={setFilterType}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                eventTypes={EVENT_TYPES}
                communityId={selectedCommunity?.id}
                communityName={selectedCommunity?.name}
                eventsTerminology={communityTheme.terminology.events}
              />
            </TabsContent>

            {/* My Events Tab */}
            <TabsContent value="my-events">
              <MyEventsTab
                events={events}
                eventsTerminology={communityTheme.terminology.events}
                selectedCommunity={!!selectedCommunity}
                onCreateEventClick={() => setIsCreateDialogOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
