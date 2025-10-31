import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import type { Event } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEvents, useUpdateEvent } from "../hooks/useEvents";
import { CalendarLayerToggle } from "./CalendarLayerToggle";
import { DayView } from "./DayView";
import { EventDetailsModal } from "./EventDetailsModal";
import { WeekView } from "./WeekView";

/**
 * CalendarViewsDemo - Integration component demonstrating all calendar UI enhancements
 *
 * This component shows how to use:
 * - EventDetailsModal for detailed event viewing
 * - DayView for daily schedule
 * - WeekView for weekly overview
 * - CalendarLayerToggle for filtering by event type
 * - Drag-and-drop for event rescheduling
 *
 * Usage:
 * ```tsx
 * import { CalendarViewsDemo } from '@/features/events/components/CalendarViewsDemo';
 *
 * function MyCalendarPage() {
 *   return <CalendarViewsDemo communityId="optional-community-id" />;
 * }
 * ```
 */

interface CalendarViewsDemoProps {
  communityId?: string;
}

export function CalendarViewsDemo({ communityId }: CalendarViewsDemoProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<"day" | "week">("week");

  // Calendar layer state
  const [layers, setLayers] = useState([
    { id: "tournament", name: "Tournaments", color: "#a855f7", visible: true },
    { id: "convention", name: "Conventions", color: "#3b82f6", visible: true },
    { id: "release", name: "Releases", color: "#22c55e", visible: true },
    {
      id: "community",
      name: "Community Events",
      color: "#f97316",
      visible: true,
    },
    { id: "game_pod", name: "Game Pods", color: "#ec4899", visible: true },
    { id: "stream", name: "Streams", color: "#ef4444", visible: true },
    { id: "personal", name: "Personal", color: "#6b7280", visible: true },
  ]);

  // Fetch events
  const { data: allEvents = [] } = useEvents(communityId);
  const updateEvent = useUpdateEvent();

  // Filter events by visible layers
  const visibleEvents = allEvents.filter((event) => {
    const layer = layers.find((l) => l.id === event.type);
    return layer?.visible ?? true;
  });

  // Handle event click - open details modal
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Handle layer toggle
  const handleLayerToggle = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
      ),
    );
  };

  // Handle drag-and-drop event rescheduling
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Parse the time slot ID (format: "slot-YYYY-MM-DD-HH-MM")
    const slotParts = over.id.toString().split("-");
    if (slotParts.length < 6) return;

    const [_, year, month, day, hour, minute] = slotParts;
    const newStartTime = new Date(
      parseInt(year || "0"),
      parseInt(month || "0") - 1,
      parseInt(day || "0"),
      parseInt(hour || "0"),
      parseInt(minute || "0"),
    );

    // Find the event being dragged
    const draggedEvent = visibleEvents.find((e) => e.id === active.id);
    if (!draggedEvent || !draggedEvent.startTime) return;

    // Calculate duration and new end time
    const oldStart = new Date(draggedEvent.startTime);
    const oldEnd = draggedEvent.endTime ? new Date(draggedEvent.endTime) : null;
    const duration = oldEnd ? oldEnd.getTime() - oldStart.getTime() : 3600000; // Default 1 hour
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Update event with new times using direct API call
    try {
      await fetch(`/api/events/${draggedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

  // Handle event edit from modal
  const handleEventEdit = (event: Event) => {
    setIsModalOpen(false);
    // In a real app, this would open an edit form
    // Example: navigate to edit page or open edit modal
  };

  // Handle event delete from modal
  const handleEventDelete = (event: Event) => {
    setIsModalOpen(false);
    // In a real app, this would show a confirmation dialog
    // Example: show confirmation modal before deleting
  };

  // Handle event export from modal
  const handleEventExport = (event: Event) => {
    // In a real app, this would trigger ICS download
    // Example: call export service or download ICS file
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {/* Main calendar view */}
            <div className="flex-1">
              <Tabs
                value={activeView}
                onValueChange={(v) => setActiveView(v as "day" | "week")}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="day">Day View</TabsTrigger>
                  <TabsTrigger value="week">Week View</TabsTrigger>
                </TabsList>

                <TabsContent value="day" className="h-[600px]">
                  <DndContext onDragEnd={handleDragEnd}>
                    <DayView
                      events={visibleEvents}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      onEventClick={handleEventClick}
                    />
                  </DndContext>
                </TabsContent>

                <TabsContent value="week" className="h-[600px]">
                  <DndContext onDragEnd={handleDragEnd}>
                    <WeekView
                      events={visibleEvents}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                      onEventClick={handleEventClick}
                    />
                  </DndContext>
                </TabsContent>
              </Tabs>
            </div>

            {/* Layer filter sidebar */}
            <div className="w-64">
              <CalendarLayerToggle
                layers={layers}
                onToggle={handleLayerToggle}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event details modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onEdit={handleEventEdit}
        onDelete={handleEventDelete}
        onExport={handleEventExport}
        allEvents={allEvents}
      />
    </div>
  );
}
