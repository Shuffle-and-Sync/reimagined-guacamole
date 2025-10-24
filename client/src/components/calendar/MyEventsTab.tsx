import { format } from "date-fns";
import type { Event } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ExtendedEvent = Event & {
  isUserAttending?: boolean;
  date?: string;
  time?: string;
};

interface MyEventsTabProps {
  events: ExtendedEvent[];
  eventsTerminology: string;
  selectedCommunity: boolean;
  onCreateEventClick: () => void;
}

/**
 * MyEventsTab - Displays user's attending and created events
 * Extracted from calendar.tsx to reduce file size and improve maintainability
 */
export function MyEventsTab({
  events,
  eventsTerminology,
  selectedCommunity,
  onCreateEventClick,
}: MyEventsTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold community-heading">
        My {eventsTerminology}
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
                        : format(new Date(event.startTime), "PPP")}{" "}
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
                onClick={onCreateEventClick}
              >
                <i className="fas fa-plus mr-2"></i>
                Create Your First Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
