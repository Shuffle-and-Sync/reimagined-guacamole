/**
 * Notification template service for generating rich, contextual notifications
 */
export interface NotificationTemplate {
  title: string;
  message: string;
  emailSubject?: string;
  emailTemplate?: string;
  pushTitle?: string;
  pushBody?: string;
  smsMessage?: string;
  priority: "low" | "normal" | "high" | "urgent";
  actionUrl?: string;
  actionText?: string;
}

export interface TemplateContext {
  user?: { id?: string; name?: string; firstName?: string; username?: string };
  fromUser?: {
    id?: string;
    name?: string;
    firstName?: string;
    username?: string;
  };
  event?: {
    id?: string;
    title?: string;
    date?: string;
    time?: string;
    location?: string;
  };
  stream?: {
    id?: string;
    title?: string;
    platform?: string;
    viewerCount?: number;
  };
  tournament?: { id?: string; name?: string; status?: string };
  community?: { id?: string; name?: string; displayName?: string };
  requestId?: string;
  conversationId?: string;
  gameId?: string;
  reminderTime?: string;
  activityType?: string;
  activityDescription?: string;
  updateType?: string;
  updateMessage?: string;
  messagePreview?: string;
  viewerCount?: number;
  weeklyStats?: unknown;
  title?: string;
  message?: string;
  priority?: string;
  actionUrl?: string;
  actionText?: string;
  type?: string;
  [key: string]: unknown;
}

export class NotificationTemplateService {
  /**
   * Generate notification from template
   */
  generateNotification(
    type: string,
    context: TemplateContext,
    customData?: unknown,
  ): NotificationTemplate {
    const generator = this.getTemplateGenerator(type);
    if (!generator) {
      return this.getDefaultTemplate(type, context);
    }

    return generator(context, customData);
  }

  /**
   * Get template generator function for notification type
   */
  private getTemplateGenerator(
    type: string,
  ):
    | ((context: TemplateContext, data?: unknown) => NotificationTemplate)
    | null {
    const generators: Record<
      string,
      (context: TemplateContext, data?: unknown) => NotificationTemplate
    > = {
      streamStarted: this.streamStartedTemplate,
      streamEnded: this.streamEndedTemplate,
      collaborationInvite: this.collaborationInviteTemplate,
      raidIncoming: this.raidIncomingTemplate,
      eventReminders: this.eventReminderTemplate,
      friendRequests: this.friendRequestTemplate,
      socialUpdates: this.socialUpdateTemplate,
      tournamentUpdates: this.tournamentUpdateTemplate,
      systemAnnouncements: this.systemAnnouncementTemplate,
      weeklyDigest: this.weeklyDigestTemplate,
      eventJoin: this.eventJoinTemplate,
      eventLeave: this.eventLeaveTemplate,
      gameInvite: this.gameInviteTemplate,
      message: this.messageTemplate,
    };

    return generators[type] || null;
  }

  /**
   * Stream started notification template
   */
  private streamStartedTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const streamerName =
      context.fromUser?.firstName || context.fromUser?.username || "A streamer";
    const streamTitle = context.stream?.title || "Untitled Stream";
    const platform = context.stream?.platform || "streaming platform";

    return {
      title: `${streamerName} is now live!`,
      message: `${streamerName} started streaming "${streamTitle}" on ${platform}`,
      emailSubject: `🔴 ${streamerName} is now live - ${streamTitle}`,
      pushTitle: `${streamerName} is live!`,
      pushBody: streamTitle,
      smsMessage: `${streamerName} is now streaming "${streamTitle}" on ${platform}`,
      priority: "normal",
      actionUrl: `/streams/${context.stream?.id || ""}`,
      actionText: "Watch Stream",
    };
  };

  /**
   * Stream ended notification template
   */
  private streamEndedTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const streamerName =
      context.fromUser?.firstName || context.fromUser?.username || "A streamer";
    const streamTitle = context.stream?.title || "stream";
    const viewerCount = context.stream?.viewerCount || 0;

    return {
      title: `${streamerName}'s stream ended`,
      message: `"${streamTitle}" has ended with ${viewerCount} viewers`,
      priority: "low",
      actionUrl: `/streams/${context.stream?.id || ""}/replay`,
      actionText: "View Replay",
    };
  };

  /**
   * Collaboration invite notification template
   */
  private collaborationInviteTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const inviterName =
      context.fromUser?.firstName || context.fromUser?.username || "A user";
    const streamTitle = context.stream?.title || "a stream";
    const collaborationType = context.type || "collaboration";

    return {
      title: `Collaboration invite from ${inviterName}`,
      message: `${inviterName} invited you to ${collaborationType} on "${streamTitle}"`,
      emailSubject: `🤝 Collaboration invite from ${inviterName}`,
      pushTitle: "Collaboration Invite",
      pushBody: `${inviterName} wants to collaborate with you`,
      priority: "high",
      actionUrl: `/collaboration-requests/${context.requestId || ""}`,
      actionText: "View Invite",
    };
  };

  /**
   * Raid incoming notification template
   */
  private raidIncomingTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const raiderName =
      context.fromUser?.firstName || context.fromUser?.username || "A streamer";
    const viewerCount = context.viewerCount || 0;

    return {
      title: `Incoming raid from ${raiderName}!`,
      message: `${raiderName} is raiding your stream with ${viewerCount} viewers!`,
      pushTitle: "Incoming Raid!",
      pushBody: `${raiderName} is bringing ${viewerCount} viewers`,
      priority: "high",
      actionUrl: "/streams/current",
      actionText: "Go to Stream",
    };
  };

  /**
   * Event reminder notification template
   */
  private eventReminderTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const eventTitle = context.event?.title || "Event";
    const eventDate = context.event?.date || "today";
    const eventTime = context.event?.time || "soon";
    const reminderTime = context.reminderTime || "15 minutes";

    return {
      title: `Event reminder: ${eventTitle}`,
      message: `"${eventTitle}" starts in ${reminderTime} (${eventDate} at ${eventTime})`,
      emailSubject: `📅 Reminder: ${eventTitle} starts soon`,
      pushTitle: "Event Reminder",
      pushBody: `${eventTitle} starts in ${reminderTime}`,
      priority: "normal",
      actionUrl: `/events/${context.event?.id || ""}`,
      actionText: "View Event",
    };
  };

  /**
   * Friend request notification template
   */
  private friendRequestTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const requesterName =
      context.fromUser?.firstName || context.fromUser?.username || "Someone";

    return {
      title: `Friend request from ${requesterName}`,
      message: `${requesterName} sent you a friend request`,
      emailSubject: `👋 Friend request from ${requesterName}`,
      pushTitle: "Friend Request",
      pushBody: `${requesterName} wants to be friends`,
      priority: "normal",
      actionUrl: "/friends/requests",
      actionText: "View Request",
    };
  };

  /**
   * Social update notification template
   */
  private socialUpdateTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const userName =
      context.fromUser?.firstName || context.fromUser?.username || "A friend";
    const activityType = context.activityType || "activity";

    return {
      title: `${userName} ${activityType}`,
      message:
        context.activityDescription || `${userName} has new ${activityType}`,
      priority: "low",
      actionUrl: `/users/${context.fromUser?.id || ""}`,
      actionText: "View Profile",
    };
  };

  /**
   * Tournament update notification template
   */
  private tournamentUpdateTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const tournamentName = context.tournament?.name || "Tournament";
    const updateType = context.updateType || "update";

    return {
      title: `Tournament ${updateType}: ${tournamentName}`,
      message:
        context.updateMessage || `${tournamentName} has a new ${updateType}`,
      emailSubject: `🏆 Tournament Update: ${tournamentName}`,
      pushTitle: "Tournament Update",
      pushBody: `${tournamentName} - ${updateType}`,
      priority: "normal",
      actionUrl: `/tournaments/${context.tournament?.id || ""}`,
      actionText: "View Tournament",
    };
  };

  /**
   * System announcement notification template
   */
  private systemAnnouncementTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const title = context.title || "System Announcement";
    const message = context.message || "New system announcement available";

    return {
      title,
      message,
      emailSubject: `📢 ${title}`,
      pushTitle: "System Announcement",
      pushBody: message,
      priority: (context.priority as any) || "normal",
      actionUrl: context.actionUrl || "/announcements",
      actionText: context.actionText || "View Details",
    };
  };

  /**
   * Weekly digest notification template
   */
  private weeklyDigestTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const userName = context.user?.firstName || "there";

    return {
      title: `Your weekly TCG update`,
      message: `Hi ${userName}! Here's what happened this week in your communities.`,
      emailSubject: `📊 Your Weekly TCG Digest`,
      priority: "low",
      actionUrl: "/digest/weekly",
      actionText: "View Full Digest",
    };
  };

  /**
   * Event join notification template
   */
  private eventJoinTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const userName =
      context.fromUser?.firstName || context.fromUser?.username || "Someone";
    const eventTitle = context.event?.title || "your event";

    return {
      title: `${userName} joined ${eventTitle}`,
      message: `${userName} joined "${eventTitle}"`,
      priority: "low",
      actionUrl: `/events/${context.event?.id || ""}`,
      actionText: "View Event",
    };
  };

  /**
   * Event leave notification template
   */
  private eventLeaveTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const userName =
      context.fromUser?.firstName || context.fromUser?.username || "Someone";
    const eventTitle = context.event?.title || "your event";

    return {
      title: `${userName} left ${eventTitle}`,
      message: `${userName} left "${eventTitle}"`,
      priority: "low",
      actionUrl: `/events/${context.event?.id || ""}`,
      actionText: "View Event",
    };
  };

  /**
   * Game invite notification template
   */
  private gameInviteTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const inviterName =
      context.fromUser?.firstName || context.fromUser?.username || "Someone";
    const gameType = context.gameType || "game";

    return {
      title: `Game invite from ${inviterName}`,
      message: `${inviterName} invited you to play ${gameType}`,
      priority: "normal",
      actionUrl: `/games/${context.gameId || ""}`,
      actionText: "Join Game",
    };
  };

  /**
   * Message notification template
   */
  private messageTemplate = (
    context: TemplateContext,
  ): NotificationTemplate => {
    const senderName =
      context.fromUser?.firstName || context.fromUser?.username || "Someone";
    const messagePreview = context.messagePreview || "sent you a message";

    return {
      title: `Message from ${senderName}`,
      message: messagePreview,
      pushTitle: "New Message",
      pushBody: `${senderName}: ${messagePreview}`,
      priority: "normal",
      actionUrl: `/messages/${context.conversationId || ""}`,
      actionText: "View Message",
    };
  };

  /**
   * Default template for unknown notification types
   */
  private getDefaultTemplate = (
    _type: string,
    context: TemplateContext,
  ): NotificationTemplate => {
    return {
      title: context.title || "Notification",
      message: context.message || "You have a new notification",
      priority: "normal",
      actionUrl: context.actionUrl,
      actionText: context.actionText,
    };
  };
}

// Export singleton instance
export const notificationTemplateService = new NotificationTemplateService();
