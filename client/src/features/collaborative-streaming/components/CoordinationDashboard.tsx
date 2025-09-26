import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Users, 
  Eye, 
  Tv, 
  Mic, 
  MicOff,
  Video,
  VideoOff,
  Radio,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { 
  useCoordinationStatus, 
  useStartCoordinationSession, 
  useUpdateCoordinationPhase 
} from '../hooks/useCollaborativeStreaming';
import { collaborativeStreamingWS } from '@/lib/websocket-client';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import type { CoordinationPhase, StreamMetrics } from '../types';

type CoordinationDashboardProps = {
  eventId: string;
  isHost?: boolean;
};

const COORDINATION_PHASES: CoordinationPhase[] = [
  {
    name: 'preparation',
    displayName: 'Preparation',
    description: 'Setting up equipment and coordinating with collaborators',
    allowedTransitions: ['live'],
  },
  {
    name: 'live',
    displayName: 'Live',
    description: 'Stream is active and broadcasting',
    allowedTransitions: ['break', 'wrap_up'],
  },
  {
    name: 'break',
    displayName: 'Break',
    description: 'Taking a break from streaming',
    allowedTransitions: ['live', 'wrap_up'],
  },
  {
    name: 'wrap_up',
    displayName: 'Wrap Up',
    description: 'Concluding the stream and final thoughts',
    allowedTransitions: ['ended'],
  },
  {
    name: 'ended',
    displayName: 'Ended',
    description: 'Stream has concluded',
    allowedTransitions: [],
  },
];

const PHASE_COLORS = {
  preparation: 'bg-blue-100 text-blue-800 border-blue-200',
  live: 'bg-green-100 text-green-800 border-green-200',
  break: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  wrap_up: 'bg-orange-100 text-orange-800 border-orange-200',
  ended: 'bg-gray-100 text-gray-800 border-gray-200',
};

const PHASE_ICONS = {
  preparation: <Clock className="h-4 w-4" />,
  live: <Radio className="h-4 w-4" />,
  break: <Pause className="h-4 w-4" />,
  wrap_up: <Square className="h-4 w-4" />,
  ended: <CheckCircle className="h-4 w-4" />,
};

export function CoordinationDashboard({ eventId, isHost = false }: CoordinationDashboardProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: coordinationStatus, isLoading } = useCoordinationStatus(eventId);
  const startSession = useStartCoordinationSession();
  const updatePhase = useUpdateCoordinationPhase();

  // Now properly typed with React Query generics
  const status = coordinationStatus;

  const handleStartSession = () => {
    startSession.mutate(eventId);
  };

  const handlePhaseUpdate = () => {
    if (selectedPhase && user && (isHost || status?.currentHost === user.id)) {
      // Use WebSocket for real-time phase update (only hosts can change phases)
      collaborativeStreamingWS.changePhase(eventId, selectedPhase);
      setSelectedPhase('');
    } else if (selectedPhase && user && !isHost && status?.currentHost !== user.id) {
      toast({
        title: "Access Denied",
        description: "Only hosts can change stream phases",
        variant: "destructive"
      });
    }
  };

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribePhaseUpdated = collaborativeStreamingWS.onPhaseUpdated((data) => {
      if (data.eventId === eventId) {
        toast({
          title: "Phase Updated",
          description: `Stream phase changed to ${data.newPhase}`,
        });
      }
    });

    const unsubscribePhaseError = collaborativeStreamingWS.onPhaseChangeError((data) => {
      if (data.eventId === eventId) {
        toast({
          title: "Phase Change Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    });

    // Join collaborative stream room (user authentication handled by WebSocket server)
    collaborativeStreamingWS.joinCollaborativeStream(eventId).catch(error => {
      console.error('Failed to join collaborative stream:', error);
    });

    return () => {
      unsubscribePhaseUpdated();
      unsubscribePhaseError();
    };
  }, [eventId, user, toast]);

  const currentPhase = COORDINATION_PHASES.find(p => p.name === status?.currentPhase) ?? COORDINATION_PHASES[0];
  const allowedTransitions = currentPhase?.allowedTransitions ?? [];

  // Mock data for demonstration - only in development
  const mockMetrics: StreamMetrics = import.meta.env.DEV ? {
    totalViewers: 1247,
    viewersByPlatform: {
      twitch: 823,
      youtube: 312,
      facebook: 112,
    },
    peakViewers: 1456,
    streamDuration: 145, // minutes
    chatActivity: 89,
    lastUpdated: new Date(),
  } : {
    totalViewers: status?.streamMetrics?.totalViewers || 0,
    viewersByPlatform: status?.streamMetrics?.platformViewers || {},
    peakViewers: 0,
    streamDuration: status?.streamMetrics?.duration || 0,
    chatActivity: 0,
    lastUpdated: new Date(),
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="coordination-dashboard-loading">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="w-48 h-6 bg-gray-300 rounded" />
              <div className="w-full h-4 bg-gray-200 rounded" />
              <div className="flex space-x-4">
                <div className="w-32 h-10 bg-gray-300 rounded" />
                <div className="w-32 h-10 bg-gray-300 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="coordination-dashboard">
      {/* Session Status & Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Coordination Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.actualStartTime ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Coordination session not started. Start the session to begin coordinating with collaborators.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-2 ${currentPhase ? PHASE_COLORS[currentPhase.name as keyof typeof PHASE_COLORS] : ''}`}
                >
                  {currentPhase ? PHASE_ICONS[currentPhase.name as keyof typeof PHASE_ICONS] : '⚙️'}
                  {currentPhase?.displayName || 'Unknown Phase'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentPhase?.description || 'Phase information unavailable'}
                </span>
              </div>
              
              {status?.actualStartTime && (
                <span className="text-sm text-muted-foreground">
                  Duration: {Math.floor(mockMetrics.streamDuration / 60)}h {mockMetrics.streamDuration % 60}m
                </span>
              )}
            </div>
          )}

          {isHost && (
            <div className="flex items-center gap-4">
              {!status?.actualStartTime ? (
                <Button
                  onClick={handleStartSession}
                  disabled={startSession.isPending}
                  data-testid="button-start-session"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {startSession.isPending ? 'Starting...' : 'Start Session'}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger className="w-48" data-testid="select-phase-transition">
                      <SelectValue placeholder="Change phase..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTransitions.map((phaseName) => {
                        const phase = COORDINATION_PHASES.find(p => p.name === phaseName);
                        return (
                          <SelectItem key={phaseName} value={phaseName} data-testid={`option-phase-${phaseName}`}>
                            {phase?.displayName}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handlePhaseUpdate}
                    disabled={!selectedPhase || updatePhase.isPending}
                    variant="outline"
                    data-testid="button-update-phase"
                  >
                    {updatePhase.isPending ? 'Updating...' : 'Update Phase'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stream Metrics */}
      {status?.actualStartTime && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-testid="card-total-viewers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.totalViewers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Peak: {mockMetrics.peakViewers.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-collaborators">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Collaborators</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.activeCollaborators?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently streaming
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-chat-activity">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat Activity</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockMetrics.chatActivity}%</div>
              <div className="mt-2">
                <Progress value={mockMetrics.chatActivity} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Status */}
      {status?.actualStartTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(mockMetrics.viewersByPlatform).map(([platform, viewers]) => (
                <div
                  key={platform}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`platform-status-${platform}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium capitalize">{platform}</div>
                      <div className="text-sm text-muted-foreground">
                        {viewers.toLocaleString()} viewers
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Live
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {isHost && status?.actualStartTime && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" data-testid="button-toggle-audio">
                <Mic className="h-4 w-4 mr-2" />
                Mute All Audio
              </Button>
              <Button variant="outline" size="sm" data-testid="button-toggle-video">
                <Video className="h-4 w-4 mr-2" />
                Disable Video
              </Button>
              <Button variant="outline" size="sm" data-testid="button-emergency-stop">
                <Square className="h-4 w-4 mr-2" />
                Emergency Stop
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}