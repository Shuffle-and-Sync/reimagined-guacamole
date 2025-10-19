import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { Users, UserMinus } from "lucide-react";
import type { CalendarEvent, Attendee } from "../types";

interface JoinEventButtonProps {
  event: CalendarEvent;
  isFull: boolean;
  onSuccess: () => void;
}

export function JoinEventButton({
  event,
  isFull: _isFull, // Not used yet - will be used for capacity checks
  onSuccess,
}: JoinEventButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [selectedPlayerType, setSelectedPlayerType] = useState<
    "main" | "alternate"
  >("main");

  // Check if user is already attending this event
  const { data: attendees = [] } = useQuery<Attendee[]>({
    queryKey: ["/api/events", event.id, "attendees"],
    queryFn: async () => {
      const response = await fetch(`/api/events/${event.id}/attendees`);
      if (!response.ok) throw new Error("Failed to fetch attendees");
      return response.json();
    },
  });

  const userAttendance = attendees.find((a) => a.userId === user?.id);
  const isAttending = !!userAttendance;

  // Join pod mutation
  const joinMutation = useMutation({
    mutationFn: async ({
      playerType,
    }: {
      playerType: "main" | "alternate";
    }) => {
      const response = await fetch(`/api/events/${event.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "attending",
          role: "participant",
          playerType,
        }),
      });
      if (!response.ok) throw new Error("Failed to join event");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setIsJoinDialogOpen(false);
      toast({
        title: "Joined game pod!",
        description: `You've joined ${event.title} as a ${selectedPlayerType} player`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to join pod",
        description: "There was an error joining the game pod",
        variant: "destructive",
      });
    },
  });

  // Leave pod mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/events/${event.id}/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to leave event");
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      toast({
        title: "Left game pod",
        description: `You've left ${event.title}`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to leave pod",
        description: "There was an error leaving the game pod",
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    joinMutation.mutate({ playerType: selectedPlayerType });
  };

  const handleLeave = () => {
    leaveMutation.mutate();
  };

  const canJoinAsMain = event.mainPlayers < event.playerSlots;
  const canJoinAsAlternate = event.alternates < (event.alternateSlots || 0);

  if (isAttending) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleLeave}
        disabled={leaveMutation.isPending}
        data-testid={`button-leave-${event.id}`}
      >
        {leaveMutation.isPending ? (
          <span>Leaving...</span>
        ) : (
          <>
            <UserMinus className="h-4 w-4 mr-1" />
            Leave Pod
          </>
        )}
      </Button>
    );
  }

  // If pod is completely full (no main or alternate slots)
  if (!canJoinAsMain && !canJoinAsAlternate) {
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled
        data-testid={`button-full-${event.id}`}
      >
        Pod Full
      </Button>
    );
  }

  // If only alternate slots available
  if (!canJoinAsMain && canJoinAsAlternate) {
    return (
      <Button
        size="sm"
        onClick={() => {
          setSelectedPlayerType("alternate");
          joinMutation.mutate({ playerType: "alternate" });
        }}
        disabled={joinMutation.isPending}
        data-testid={`button-join-alternate-${event.id}`}
      >
        {joinMutation.isPending ? "Joining..." : "Join as Alternate"}
      </Button>
    );
  }

  // Show join dialog for player type selection
  return (
    <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid={`button-join-${event.id}`}>
          <Users className="h-4 w-4 mr-1" />
          Join Pod
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Game Pod</DialogTitle>
          <DialogDescription>
            Choose your player type for {event.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Player Type</Label>
            <Select
              value={selectedPlayerType}
              onValueChange={(value: "main" | "alternate") =>
                setSelectedPlayerType(value)
              }
            >
              <SelectTrigger data-testid="select-player-type">
                <SelectValue placeholder="Select player type" />
              </SelectTrigger>
              <SelectContent>
                {canJoinAsMain && (
                  <SelectItem value="main">
                    <div className="flex items-center justify-between w-full">
                      <span>Main Player</span>
                      <Badge variant="outline" className="ml-2">
                        {event.mainPlayers}/{event.playerSlots}
                      </Badge>
                    </div>
                  </SelectItem>
                )}
                {canJoinAsAlternate && (
                  <SelectItem value="alternate">
                    <div className="flex items-center justify-between w-full">
                      <span>Alternate Player</span>
                      <Badge variant="outline" className="ml-2">
                        {event.alternates}/{event.alternateSlots || 0}
                      </Badge>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {selectedPlayerType === "main"
                ? "Main players are guaranteed a spot at the table and participate directly in the game."
                : "Alternate players can join if a main player drops out. You'll be notified if a spot opens up."}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsJoinDialogOpen(false)}
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              data-testid="button-confirm-join"
            >
              {joinMutation.isPending
                ? "Joining..."
                : `Join as ${selectedPlayerType}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
