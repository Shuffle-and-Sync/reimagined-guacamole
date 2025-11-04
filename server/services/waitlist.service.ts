import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { storage } from "../storage";
import { enhancedNotificationService } from "./enhanced-notifications";

export class WaitlistService {
  /**
   * Join event with automatic waitlist assignment
   */
  async joinEventWithWaitlist(
    eventId: string,
    userId: string,
    requestedPlayerType: "main" | "alternate" = "main",
  ) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      // Get current attendees
      const attendees = await storage.getEventAttendees(eventId);
      const mainPlayers = attendees.filter(
        (a) => a.playerType === "main" && a.status === "attending",
      ).length;
      const alternates = attendees.filter(
        (a) => a.playerType === "alternate" && a.status === "attending",
      ).length;

      const playerSlots = event.playerSlots || 4;
      const alternateSlots = event.alternateSlots || 2;

      let assignedPlayerType: "main" | "alternate" = "main";
      let waitlistPosition = 0;

      // Determine placement
      if (requestedPlayerType === "main") {
        if (mainPlayers < playerSlots) {
          assignedPlayerType = "main";
        } else if (alternates < alternateSlots) {
          assignedPlayerType = "alternate";
          // Calculate waitlist position (alternates serve as waitlist)
          waitlistPosition = alternates + 1;
        } else {
          // Pod is completely full
          throw new Error(
            "Event is full. Please try again later or contact the organizer.",
          );
        }
      } else {
        if (alternates < alternateSlots) {
          assignedPlayerType = "alternate";
          waitlistPosition = alternates + 1;
        } else {
          throw new Error("Alternate slots are full");
        }
      }

      // Join the event
      const attendee = await storage.joinEvent({
        eventId,
        userId,
        status: "attending",
        role: "participant",
        playerType: assignedPlayerType,
      });

      // Log waitlist position if applicable
      if (assignedPlayerType === "alternate") {
        logger.info("User added to waitlist", {
          eventId,
          userId,
          position: waitlistPosition,
        });
      }

      return {
        attendee,
        playerType: assignedPlayerType,
        waitlistPosition:
          assignedPlayerType === "alternate" ? waitlistPosition : 0,
        isWaitlisted: assignedPlayerType === "alternate",
      };
    } catch (error) {
      logger.error(
        "Failed to join event with waitlist",
        toLoggableError(error),
        {
          eventId,
          userId,
        },
      );
      throw error;
    }
  }

  /**
   * Promote from waitlist when a slot opens
   */
  async promoteFromWaitlist(eventId: string) {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) return;

      const attendees = await storage.getEventAttendees(eventId);
      const mainPlayers = attendees.filter(
        (a) => a.playerType === "main" && a.status === "attending",
      );
      const alternates = attendees
        .filter((a) => a.playerType === "alternate" && a.status === "attending")
        .sort((a, b) => {
          const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return aTime - bTime;
        }); // Sort by join time

      const playerSlots = event.playerSlots || 4;

      // Check if there are open main slots
      if (mainPlayers.length < playerSlots && alternates.length > 0) {
        // Promote the first alternate (earliest joined)
        const toPromote = alternates[0];

        if (!toPromote) return null;

        // Update their player type
        await storage.updateEventAttendee(toPromote.id, {
          playerType: "main",
        });

        // Send promotion notification
        await enhancedNotificationService.sendWaitlistPromotedNotification(
          eventId,
          toPromote.userId,
        );

        logger.info("Promoted from waitlist", {
          eventId,
          userId: toPromote.userId,
          attendeeId: toPromote.id,
        });

        return toPromote;
      }

      return null;
    } catch (error) {
      logger.error("Failed to promote from waitlist", toLoggableError(error), {
        eventId,
      });
      throw error;
    }
  }

  /**
   * Get waitlist position for a user
   */
  async getWaitlistPosition(eventId: string, userId: string): Promise<number> {
    try {
      const attendees = await storage.getEventAttendees(eventId);
      const alternates = attendees
        .filter((a) => a.playerType === "alternate" && a.status === "attending")
        .sort((a, b) => {
          const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return aTime - bTime;
        });

      const position = alternates.findIndex((a) => a.userId === userId);
      return position >= 0 ? position + 1 : 0;
    } catch (error) {
      logger.error("Failed to get waitlist position", toLoggableError(error), {
        eventId,
        userId,
      });
      return 0;
    }
  }

  /**
   * Get all waitlisted users for an event
   */
  async getWaitlist(eventId: string) {
    try {
      const attendees = await storage.getEventAttendees(eventId);
      const waitlist = attendees
        .filter((a) => a.playerType === "alternate" && a.status === "attending")
        .sort((a, b) => {
          const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
          const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
          return aTime - bTime;
        })
        .map((a, index) => ({
          ...a,
          position: index + 1,
        }));

      return waitlist;
    } catch (error) {
      logger.error("Failed to get waitlist", toLoggableError(error), {
        eventId,
      });
      return [];
    }
  }
}

// Helper method for storage (needs to be added to storage.ts)
declare module "../storage" {
  interface DatabaseStorage {
    updateEventAttendee(id: string, data: unknown): Promise<unknown>;
  }
}

export const waitlistService = new WaitlistService();
