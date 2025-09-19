import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Calendar, 
  Users, 
  Activity, 
  Play, 
  Settings,
  Video,
  Clock,
  Eye
} from 'lucide-react';
import { useCollaborativeStreamEvents } from '../hooks/useCollaborativeStreaming';
import { StreamEventForm } from '../components/StreamEventForm';
import { CollaboratorManagement } from '../components/CollaboratorManagement';
import { CoordinationDashboard } from '../components/CoordinationDashboard';
import { SessionMonitor } from '../components/SessionMonitor';
import type { CollaborativeStreamEvent } from '../types';

export default function CollaborativeStreamingDashboard() {
  const [, setLocation] = useLocation();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('events');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: events = [], isLoading } = useCollaborativeStreamEvents();
  
  // Now properly typed with React Query generics

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setActiveTab('coordination');
  };

  const selectedEvent = events.find((event: CollaborativeStreamEvent) => event.id === selectedEventId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      live: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || colors.planning;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl" data-testid="loading-dashboard">
        <div className="animate-pulse space-y-6">
          <div className="w-64 h-8 bg-gray-300 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-48 bg-gray-300 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6" data-testid="collaborative-streaming-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaborative Streaming</h1>
          <p className="text-muted-foreground">
            Coordinate multi-streamer events and manage collaborative broadcasts
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Stream Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <StreamEventForm
              onSuccess={() => setIsCreateDialogOpen(false)}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="events" data-testid="tab-events">
            <Calendar className="h-4 w-4 mr-2" />
            My Events
          </TabsTrigger>
          <TabsTrigger value="coordination" disabled={!selectedEventId} data-testid="tab-coordination">
            <Activity className="h-4 w-4 mr-2" />
            Coordination
          </TabsTrigger>
          <TabsTrigger value="monitor" disabled={!selectedEventId} data-testid="tab-monitor">
            <Eye className="h-4 w-4 mr-2" />
            Live Monitor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Stream Events Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first collaborative streaming event to get started
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-event">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event: CollaborativeStreamEvent) => (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleEventSelect(event.id)}
                  data-testid={`event-card-${event.id}`}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                      <Badge variant="outline" className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(event.scheduledStartTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.maxCollaborators || 4} max</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">Platforms:</span>
                        <div className="flex gap-1">
                          {event.streamingPlatforms?.map((platform: string) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-medium">Type:</span>
                        <Badge variant="outline" className="text-xs">
                          {event.contentType}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Event
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coordination" className="space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedEvent.title}</CardTitle>
                      <p className="text-muted-foreground">
                        Scheduled: {formatDate(selectedEvent.scheduledStartTime)}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(selectedEvent.status)}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Collaborator Management */}
              <CollaboratorManagement 
                eventId={selectedEvent.id} 
                isOwner={true} // TODO: Check if current user is creator
              />

              {/* Coordination Dashboard */}
              <CoordinationDashboard 
                eventId={selectedEvent.id} 
                isHost={true} // TODO: Check if current user is host
              />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select an Event</h3>
                <p className="text-muted-foreground">
                  Choose a stream event from the events tab to access coordination tools
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          {selectedEvent ? (
            <div className="space-y-6">
              {/* Event Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Live Monitoring: {selectedEvent.title}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        Real-time status and metrics for your collaborative stream
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-muted-foreground">Live</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Session Monitor */}
              <SessionMonitor eventId={selectedEvent.id} />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select an Event</h3>
                <p className="text-muted-foreground">
                  Choose a stream event to monitor live metrics and collaborator status
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}