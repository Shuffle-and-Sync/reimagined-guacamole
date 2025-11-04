import {
  Activity,
  Users,
  MessageSquare,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Eye,
  Heart,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCoordinationStatus } from "../hooks/useCollaborativeStreaming";
import type { CoordinationEvent, StreamMetrics } from "../types";

type SessionMonitorProps = {
  eventId: string;
};

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

type CollaboratorStatus = {
  id: string;
  name: string;
  role: string;
  isLive: boolean;
  connectionStatus: ConnectionStatus;
  audioEnabled: boolean;
  videoEnabled: boolean;
  lastSeen: Date;
  viewerCount: number;
};

export function SessionMonitor({ eventId }: SessionMonitorProps) {
  const { data: coordinationStatus } = useCoordinationStatus(eventId);
  const [events, setEvents] = useState<CoordinationEvent[]>([]);

  // Now properly typed with React Query generics
  const status = coordinationStatus;

  // Mock data for demonstration - only in development
  // Use useState to capture timestamp at component mount to avoid impure function call during render
  const [nowTimestamp] = useState(() => Date.now());
  const mockCollaborators: CollaboratorStatus[] = useMemo(() => {
    if (!import.meta.env.DEV) return [];

    const now = nowTimestamp;
    return [
      {
        id: "1",
        name: "StreamMaster",
        role: "host",
        isLive: true,
        connectionStatus: "connected" as ConnectionStatus,
        audioEnabled: true,
        videoEnabled: true,
        lastSeen: new Date(now),
        viewerCount: 823,
      },
      {
        id: "2",
        name: "CoStreamPro",
        role: "co_host",
        isLive: true,
        connectionStatus: "connected" as ConnectionStatus,
        audioEnabled: true,
        videoEnabled: false,
        lastSeen: new Date(now - 30000),
        viewerCount: 312,
      },
      {
        id: "3",
        name: "GuestPlayer",
        role: "guest",
        isLive: false,
        connectionStatus: "disconnected" as ConnectionStatus,
        audioEnabled: false,
        videoEnabled: false,
        lastSeen: new Date(now - 120000),
        viewerCount: 0,
      },
    ];
  }, [nowTimestamp]);

  const mockMetrics: StreamMetrics = import.meta.env.DEV
    ? {
        totalViewers: 1247,
        viewersByPlatform: {
          twitch: 823,
          youtube: 312,
          facebook: 112,
        },
        peakViewers: 1456,
        streamDuration: 145,
        chatActivity: 89,
        lastUpdated: new Date(),
      }
    : {
        totalViewers: status?.streamMetrics?.totalViewers || 0,
        viewersByPlatform: status?.streamMetrics?.platformViewers || {},
        peakViewers: 0,
        streamDuration: status?.streamMetrics?.duration || 0,
        chatActivity: 0,
        lastUpdated: new Date(),
      };

  // Simulate real-time events - only in development
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const eventTypes: CoordinationEvent["type"][] = [
      "phase_change",
      "collaborator_joined",
      "collaborator_left",
      "platform_status",
      "message",
    ];
    const interval = setInterval(() => {
      const randomType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];
      if (!randomType) {
        return;
      }

      const randomEvent: CoordinationEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: randomType,
        timestamp: new Date(),
        data: { message: "Sample event data" },
        message: `Event occurred at ${new Date().toLocaleTimeString()}`,
      };

      setEvents((prev) => [randomEvent, ...prev.slice(0, 19)]); // Keep last 20 events
    }, 10000); // New event every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getConnectionIcon = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case "reconnecting":
        return <Activity className="h-4 w-4 text-yellow-500 animate-spin" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "phase_change":
        return <Radio className="h-4 w-4" />;
      case "collaborator_joined":
        return <Users className="h-4 w-4 text-green-500" />;
      case "collaborator_left":
        return <Users className="h-4 w-4 text-red-500" />;
      case "platform_status":
        return <Activity className="h-4 w-4" />;
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6" data-testid="session-monitor">
      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-viewers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Viewers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMetrics.totalViewers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-collaborators">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockCollaborators.filter((c) => c.isLive).length} /{" "}
              {mockCollaborators.length}
            </div>
            <p className="text-xs text-muted-foreground">Active / Total</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-duration">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stream Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(mockMetrics.streamDuration / 60)}:
              {String(mockMetrics.streamDuration % 60).padStart(2, "0")}
            </div>
            <p className="text-xs text-muted-foreground">Hours : Minutes</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-engagement">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMetrics.chatActivity}%
            </div>
            <p className="text-xs text-muted-foreground">Chat activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collaborator Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborator Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCollaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`collaborator-status-${collaborator.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback>
                          {collaborator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {collaborator.isLive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{collaborator.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {collaborator.role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getConnectionIcon(collaborator.connectionStatus)}
                        <span className="capitalize">
                          {collaborator.connectionStatus}
                        </span>
                        {collaborator.isLive && (
                          <>
                            <span>•</span>
                            <Eye className="h-3 w-3" />
                            <span>{collaborator.viewerCount}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {collaborator.isLive && (
                      <>
                        <div
                          className={`p-1 rounded ${collaborator.audioEnabled ? "bg-green-100" : "bg-red-100"}`}
                        >
                          {collaborator.audioEnabled ? (
                            <Activity className="h-3 w-3 text-green-600" />
                          ) : (
                            <Activity className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <div
                          className={`p-1 rounded ${collaborator.videoEnabled ? "bg-green-100" : "bg-red-100"}`}
                        >
                          {collaborator.videoEnabled ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">
                      Events will appear here as they happen
                    </p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50"
                      data-testid={`event-${event.id}`}
                    >
                      <div className="p-1 rounded-full bg-background">
                        {getEventIcon(event.type)}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {event.type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>

                        {event.message && (
                          <p className="text-sm text-muted-foreground">
                            {event.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(mockMetrics.viewersByPlatform).map(
              ([platform, viewers]) => {
                const percentage = (viewers / mockMetrics.totalViewers) * 100;
                return (
                  <div
                    key={platform}
                    className="space-y-2"
                    data-testid={`platform-metric-${platform}`}
                  >
                    <div className="flex justify-between">
                      <span className="text-sm font-medium capitalize">
                        {platform}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {viewers.toLocaleString()} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
