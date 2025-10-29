import { describe, it, expect } from "@jest/globals";
import { emailTemplatesService } from "./email-templates";

describe("EmailTemplatesService", () => {
  const baseData = {
    userName: "TestUser",
    baseUrl: "https://shuffleandsync.com",
    unsubscribeUrl: "https://shuffleandsync.com/unsubscribe",
  };

  describe("streamStarted", () => {
    it("should generate stream started email template", () => {
      const template = emailTemplatesService.streamStarted({
        ...baseData,
        streamerName: "John",
        streamTitle: "Magic: The Gathering Commander",
        streamUrl: "https://shuffleandsync.com/streams/123",
        platform: "Twitch",
      });

      expect(template.subject).toContain("John is now live");
      expect(template.subject).toContain("Magic: The Gathering Commander");
      expect(template.html).toContain("John");
      expect(template.html).toContain("Twitch");
      expect(template.html).toContain("Watch Stream Now");
      expect(template.text).toContain("John is now live");
      expect(template.text).toContain("Watch now:");
    });

    it("should handle missing optional fields with defaults", () => {
      const template = emailTemplatesService.streamStarted(baseData);

      expect(template.subject).toContain("A friend is now live");
      expect(template.html).toContain("A friend");
      expect(template.html).toContain("Untitled Stream");
    });
  });

  describe("collaborationInvite", () => {
    it("should generate collaboration invite email template", () => {
      const template = emailTemplatesService.collaborationInvite({
        ...baseData,
        inviterName: "Jane",
        streamTitle: "Pokemon Tournament Coverage",
        collaborationUrl: "https://shuffleandsync.com/invites/456",
      });

      expect(template.subject).toContain("Collaboration invite from Jane");
      expect(template.html).toContain("Jane");
      expect(template.html).toContain("Pokemon Tournament Coverage");
      expect(template.html).toContain("View Invitation");
      expect(template.text).toContain("🤝");
    });
  });

  describe("raidIncoming", () => {
    it("should generate raid notification email template", () => {
      const template = emailTemplatesService.raidIncoming({
        ...baseData,
        raiderName: "Bob",
        viewerCount: 150,
        currentStreamUrl: "https://shuffleandsync.com/streams/current",
      });

      expect(template.subject).toContain("Incoming raid from Bob");
      expect(template.subject).toContain("150 viewers");
      expect(template.html).toContain("Bob");
      expect(template.html).toContain("150 viewers");
      expect(template.html).toContain("🎉");
      expect(template.text).toContain("Get ready to welcome");
    });
  });

  describe("eventReminders", () => {
    it("should generate event reminder email template", () => {
      const template = emailTemplatesService.eventReminders({
        ...baseData,
        eventTitle: "Yu-Gi-Oh! Duel Night",
        eventDate: "2024-11-01",
        eventTime: "19:00 EST",
        eventUrl: "https://shuffleandsync.com/events/789",
        reminderTime: "1 hour",
      });

      expect(template.subject).toContain("Reminder:");
      expect(template.subject).toContain("Yu-Gi-Oh! Duel Night");
      expect(template.subject).toContain("1 hour");
      expect(template.html).toContain("📅");
      expect(template.html).toContain("2024-11-01");
      expect(template.html).toContain("19:00 EST");
    });
  });

  describe("friendRequests", () => {
    it("should generate friend request email template", () => {
      const template = emailTemplatesService.friendRequests({
        ...baseData,
        requesterName: "Alice",
        friendRequestsUrl: "https://shuffleandsync.com/friends/requests",
      });

      expect(template.subject).toContain("Friend request from Alice");
      expect(template.html).toContain("Alice");
      expect(template.html).toContain("👋");
      expect(template.html).toContain("View Request");
      expect(template.text).toContain("wants to be your friend");
    });
  });

  describe("tournamentUpdates", () => {
    it("should generate tournament update email template", () => {
      const template = emailTemplatesService.tournamentUpdates({
        ...baseData,
        tournamentName: "Lorcana Championship",
        updateMessage: "Round 2 has started!",
        tournamentUrl: "https://shuffleandsync.com/tournaments/101",
      });

      expect(template.subject).toContain("Tournament Update");
      expect(template.subject).toContain("Lorcana Championship");
      expect(template.html).toContain("🏆");
      expect(template.html).toContain("Round 2 has started!");
      expect(template.text).toContain("Lorcana Championship");
    });
  });

  describe("systemAnnouncements", () => {
    it("should generate system announcement email template", () => {
      const template = emailTemplatesService.systemAnnouncements({
        ...baseData,
        announcementTitle: "New Feature: Deck Builder",
        announcementMessage:
          "We've launched a new universal deck builder for all TCGs!",
        announcementUrl: "https://shuffleandsync.com/announcements/new",
      });

      expect(template.subject).toContain("New Feature: Deck Builder");
      expect(template.html).toContain("📢");
      expect(template.html).toContain(
        "We've launched a new universal deck builder",
      );
      expect(template.html).toContain("Learn More");
    });

    it("should handle announcements without URL", () => {
      const template = emailTemplatesService.systemAnnouncements({
        ...baseData,
        announcementTitle: "Maintenance Notice",
        announcementMessage: "Scheduled maintenance tonight at 2 AM EST.",
      });

      expect(template.html).not.toContain("Learn More");
      expect(template.text).not.toContain("Learn more:");
    });
  });

  describe("weeklyDigest", () => {
    it("should generate weekly digest email template with stats", () => {
      const template = emailTemplatesService.weeklyDigest({
        ...baseData,
        weeklyStats: {
          streamsWatched: 12,
          eventsAttended: 3,
          newFriends: 5,
          hoursStreamed: 8,
        },
        digestUrl: "https://shuffleandsync.com/digest/weekly",
      });

      expect(template.subject).toContain("Your Weekly TCG Digest");
      expect(template.html).toContain("📊");
      expect(template.html).toContain("12"); // streams watched
      expect(template.html).toContain("3"); // events attended
      expect(template.html).toContain("5"); // new friends
      expect(template.html).toContain("8"); // hours streamed
      expect(template.text).toContain("Streams Watched: 12");
    });

    it("should handle missing stats with defaults", () => {
      const template = emailTemplatesService.weeklyDigest({
        ...baseData,
        digestUrl: "https://shuffleandsync.com/digest/weekly",
      });

      expect(template.html).toContain("0"); // default stats
      expect(template.text).toContain("Streams Watched: 0");
    });
  });

  describe("getTemplate", () => {
    it("should return correct template for known types", () => {
      const template = emailTemplatesService.getTemplate("streamStarted", {
        ...baseData,
        streamerName: "Test",
        streamTitle: "Test Stream",
        streamUrl: "#",
      });

      expect(template.subject).toContain("Test is now live");
    });

    it("should return default template for unknown types", () => {
      const template = emailTemplatesService.getTemplate("unknownType", {
        ...baseData,
        announcementTitle: "Custom Notification",
        announcementMessage: "This is a custom message",
      });

      expect(template.subject).toContain("Custom Notification");
      expect(template.html).toContain("This is a custom message");
    });
  });

  describe("Email format validation", () => {
    it("should include unsubscribe link in all templates", () => {
      const types = [
        "streamStarted",
        "collaborationInvite",
        "raidIncoming",
        "eventReminders",
        "friendRequests",
        "tournamentUpdates",
        "systemAnnouncements",
        "weeklyDigest",
      ];

      types.forEach((type) => {
        const template = emailTemplatesService.getTemplate(type, {
          ...baseData,
          streamerName: "Test",
          inviterName: "Test",
          raiderName: "Test",
          viewerCount: 100,
          eventTitle: "Test Event",
          requesterName: "Test",
          tournamentName: "Test Tournament",
          announcementTitle: "Test",
          announcementMessage: "Test",
        });

        expect(template.html).toContain("Unsubscribe");
        expect(template.text).toContain("Unsubscribe");
      });
    });

    it("should generate valid HTML structure", () => {
      const template = emailTemplatesService.streamStarted({
        ...baseData,
        streamerName: "Test",
        streamTitle: "Test",
        streamUrl: "#",
      });

      expect(template.html).toContain("<!DOCTYPE html>");
      expect(template.html).toContain("<html");
      expect(template.html).toContain("</html>");
      expect(template.html).toContain("<head>");
      expect(template.html).toContain("<body>");
    });

    it("should include responsive meta tags", () => {
      const template = emailTemplatesService.streamStarted({
        ...baseData,
        streamerName: "Test",
        streamTitle: "Test",
        streamUrl: "#",
      });

      expect(template.html).toContain('name="viewport"');
      expect(template.html).toContain("charset");
    });

    it("should include Shuffle & Sync branding", () => {
      const template = emailTemplatesService.streamStarted({
        ...baseData,
        streamerName: "Test",
        streamTitle: "Test",
        streamUrl: "#",
      });

      expect(template.html).toContain("Shuffle & Sync");
      expect(template.html).toContain("🎮");
    });
  });
});
