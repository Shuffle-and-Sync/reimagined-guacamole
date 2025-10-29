/**
 * Email template service for generating HTML and plain text emails
 * Supports all notification types with responsive HTML designs
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplateData {
  userName?: string;
  streamerName?: string;
  streamTitle?: string;
  streamUrl?: string;
  platform?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventUrl?: string;
  inviterName?: string;
  collaborationUrl?: string;
  raiderName?: string;
  viewerCount?: number;
  currentStreamUrl?: string;
  reminderTime?: string;
  requesterName?: string;
  friendRequestsUrl?: string;
  tournamentName?: string;
  tournamentUrl?: string;
  updateMessage?: string;
  announcementTitle?: string;
  announcementMessage?: string;
  announcementUrl?: string;
  weeklyStats?: {
    streamsWatched?: number;
    eventsAttended?: number;
    newFriends?: number;
    hoursStreamed?: number;
  };
  digestUrl?: string;
  unsubscribeUrl?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * Base HTML wrapper with responsive styles
 */
function getBaseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shuffle & Sync</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin-top: 0;
      color: #333333;
      font-size: 24px;
    }
    .content p {
      margin: 15px 0;
      color: #555555;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: #5568d3;
    }
    .highlight-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .stats-grid {
      display: table;
      width: 100%;
      margin: 25px 0;
    }
    .stat-item {
      display: table-cell;
      text-align: center;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      display: block;
      font-size: 14px;
      color: #666666;
      margin-top: 5px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666666;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .button {
        display: block;
        width: 100%;
      }
      .stat-item {
        display: block;
        margin-bottom: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Shuffle & Sync</h1>
      <p>Trading Card Game Community</p>
    </div>
    ${content}
    <div class="footer">
      <p><strong>Shuffle & Sync</strong> - Your TCG Streaming Hub</p>
      <div class="social-links">
        <a href="https://twitter.com/shuffleandsync">Twitter</a> •
        <a href="https://discord.gg/shuffleandsync">Discord</a> •
        <a href="https://shuffleandsync.com">Website</a>
      </div>
      <p>
        <a href="{unsubscribeUrl}">Unsubscribe</a> from these emails
      </p>
      <p style="font-size: 12px; color: #999999; margin-top: 20px;">
        This email was sent to you because you have an account with Shuffle & Sync.<br>
        © 2024 Shuffle & Sync. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Email template generators
 */
export class EmailTemplatesService {
  /**
   * Generate email template for stream started notification
   */
  streamStarted(data: EmailTemplateData): EmailTemplate {
    const {
      streamerName = "A friend",
      streamTitle = "Untitled Stream",
      streamUrl = "#",
      platform = "their platform",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>🔴 ${streamerName} is now live!</h2>
        <p>Your friend <strong>${streamerName}</strong> just started streaming on ${platform}.</p>
        <div class="highlight-box">
          <strong>${streamTitle}</strong>
        </div>
        <p>Join the stream now and be part of the action!</p>
        <a href="${streamUrl}" class="button">Watch Stream Now</a>
        <p style="color: #888888; font-size: 14px;">
          Don't want notifications when friends go live? 
          <a href="${data.baseUrl}/settings/notifications">Update your preferences</a>
        </p>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
${streamerName} is now live!

Your friend ${streamerName} just started streaming "${streamTitle}" on ${platform}.

Watch now: ${streamUrl}

Don't want these notifications? Update your preferences: ${data.baseUrl}/settings/notifications

Unsubscribe: ${unsubscribeUrl}

© 2024 Shuffle & Sync
    `.trim();

    return {
      subject: `🔴 ${streamerName} is now live - ${streamTitle}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for stream ended notification
   */
  streamEnded(data: EmailTemplateData): EmailTemplate {
    const {
      streamerName = "A friend",
      streamTitle = "the stream",
      viewerCount = 0,
      streamUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>${streamerName}'s stream has ended</h2>
        <p><strong>${streamTitle}</strong> has concluded with ${viewerCount} viewers.</p>
        <p>Missed it? You can watch the replay:</p>
        <a href="${streamUrl}/replay" class="button">View Replay</a>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
${streamerName}'s stream has ended

"${streamTitle}" has concluded with ${viewerCount} viewers.

Watch the replay: ${streamUrl}/replay

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `${streamerName}'s stream has ended`,
      html,
      text,
    };
  }

  /**
   * Generate email template for collaboration invite
   */
  collaborationInvite(data: EmailTemplateData): EmailTemplate {
    const {
      inviterName = "A user",
      streamTitle = "a stream",
      collaborationUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>🤝 Collaboration Invite</h2>
        <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>${streamTitle}</strong>!</p>
        <div class="highlight-box">
          <p>This is a great opportunity to stream together and grow your audience!</p>
        </div>
        <a href="${collaborationUrl}" class="button">View Invitation</a>
        <p style="color: #888888; font-size: 14px;">
          You can accept or decline this invitation from your collaboration requests page.
        </p>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
🤝 Collaboration Invite from ${inviterName}

${inviterName} has invited you to collaborate on "${streamTitle}"!

This is a great opportunity to stream together and grow your audience.

View invitation: ${collaborationUrl}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `🤝 Collaboration invite from ${inviterName}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for incoming raid
   */
  raidIncoming(data: EmailTemplateData): EmailTemplate {
    const {
      raiderName = "A streamer",
      viewerCount = 0,
      currentStreamUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>🎉 Incoming Raid!</h2>
        <p><strong>${raiderName}</strong> is raiding your stream with <strong>${viewerCount} viewers</strong>!</p>
        <div class="highlight-box">
          <p style="font-size: 18px; margin: 0;">Get ready to welcome your new viewers!</p>
        </div>
        <a href="${currentStreamUrl}" class="button">Go to Your Stream</a>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
🎉 Incoming Raid!

${raiderName} is raiding your stream with ${viewerCount} viewers!

Get ready to welcome your new viewers!

Go to your stream: ${currentStreamUrl}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `🎉 Incoming raid from ${raiderName} - ${viewerCount} viewers!`,
      html,
      text,
    };
  }

  /**
   * Generate email template for event reminder
   */
  eventReminders(data: EmailTemplateData): EmailTemplate {
    const {
      eventTitle = "Event",
      eventDate = "today",
      eventTime = "soon",
      eventUrl = "#",
      reminderTime = "15 minutes",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>📅 Event Reminder</h2>
        <p><strong>${eventTitle}</strong> starts in ${reminderTime}!</p>
        <div class="highlight-box">
          <p><strong>When:</strong> ${eventDate} at ${eventTime}</p>
        </div>
        <a href="${eventUrl}" class="button">View Event Details</a>
        <p style="color: #888888; font-size: 14px;">
          Make sure you're ready to participate. See you there!
        </p>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
📅 Event Reminder

"${eventTitle}" starts in ${reminderTime}!

When: ${eventDate} at ${eventTime}

View event details: ${eventUrl}

Make sure you're ready to participate. See you there!

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `📅 Reminder: ${eventTitle} starts in ${reminderTime}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for friend request
   */
  friendRequests(data: EmailTemplateData): EmailTemplate {
    const {
      requesterName = "Someone",
      friendRequestsUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>👋 New Friend Request</h2>
        <p><strong>${requesterName}</strong> wants to be your friend on Shuffle & Sync!</p>
        <div class="highlight-box">
          <p>Connect with fellow TCG streamers and content creators to grow your network.</p>
        </div>
        <a href="${friendRequestsUrl}" class="button">View Request</a>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
👋 New Friend Request

${requesterName} wants to be your friend on Shuffle & Sync!

Connect with fellow TCG streamers and content creators to grow your network.

View request: ${friendRequestsUrl}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `👋 Friend request from ${requesterName}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for tournament updates
   */
  tournamentUpdates(data: EmailTemplateData): EmailTemplate {
    const {
      tournamentName = "Tournament",
      updateMessage = "has a new update",
      tournamentUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>🏆 Tournament Update</h2>
        <p><strong>${tournamentName}</strong></p>
        <div class="highlight-box">
          <p>${updateMessage}</p>
        </div>
        <a href="${tournamentUrl}" class="button">View Tournament</a>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
🏆 Tournament Update

${tournamentName}

${updateMessage}

View tournament: ${tournamentUrl}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `🏆 Tournament Update: ${tournamentName}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for system announcements
   */
  systemAnnouncements(data: EmailTemplateData): EmailTemplate {
    const {
      announcementTitle = "System Announcement",
      announcementMessage = "We have an important update.",
      announcementUrl = "#",
      unsubscribeUrl = "#",
    } = data;

    const html = getBaseHtml(`
      <div class="content">
        <h2>📢 ${announcementTitle}</h2>
        <div class="highlight-box">
          <p>${announcementMessage}</p>
        </div>
        ${announcementUrl !== "#" ? `<a href="${announcementUrl}" class="button">Learn More</a>` : ""}
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
📢 ${announcementTitle}

${announcementMessage}

${announcementUrl !== "#" ? `Learn more: ${announcementUrl}` : ""}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `📢 ${announcementTitle}`,
      html,
      text,
    };
  }

  /**
   * Generate email template for weekly digest
   */
  weeklyDigest(data: EmailTemplateData): EmailTemplate {
    const {
      userName = "there",
      weeklyStats = {},
      digestUrl = "#",
      unsubscribeUrl = "#",
    } = data;
    const stats = {
      streamsWatched: weeklyStats.streamsWatched || 0,
      eventsAttended: weeklyStats.eventsAttended || 0,
      newFriends: weeklyStats.newFriends || 0,
      hoursStreamed: weeklyStats.hoursStreamed || 0,
    };

    const html = getBaseHtml(`
      <div class="content">
        <h2>📊 Your Weekly TCG Digest</h2>
        <p>Hi ${userName}! Here's what happened this week in your communities.</p>
        <div class="stats-grid">
          <table width="100%" cellpadding="10" cellspacing="10">
            <tr>
              <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                <span style="display: block; font-size: 32px; font-weight: bold; color: #667eea;">${stats.streamsWatched}</span>
                <span style="display: block; font-size: 14px; color: #666666; margin-top: 5px;">Streams Watched</span>
              </td>
              <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                <span style="display: block; font-size: 32px; font-weight: bold; color: #667eea;">${stats.eventsAttended}</span>
                <span style="display: block; font-size: 14px; color: #666666; margin-top: 5px;">Events Attended</span>
              </td>
            </tr>
            <tr>
              <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                <span style="display: block; font-size: 32px; font-weight: bold; color: #667eea;">${stats.newFriends}</span>
                <span style="display: block; font-size: 14px; color: #666666; margin-top: 5px;">New Friends</span>
              </td>
              <td align="center" style="background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                <span style="display: block; font-size: 32px; font-weight: bold; color: #667eea;">${stats.hoursStreamed}</span>
                <span style="display: block; font-size: 14px; color: #666666; margin-top: 5px;">Hours Streamed</span>
              </td>
            </tr>
          </table>
        </div>
        <a href="${digestUrl}" class="button">View Full Digest</a>
      </div>
    `).replace("{unsubscribeUrl}", unsubscribeUrl);

    const text = `
📊 Your Weekly TCG Digest

Hi ${userName}! Here's what happened this week:

- Streams Watched: ${stats.streamsWatched}
- Events Attended: ${stats.eventsAttended}
- New Friends: ${stats.newFriends}
- Hours Streamed: ${stats.hoursStreamed}

View full digest: ${digestUrl}

Unsubscribe: ${unsubscribeUrl}
    `.trim();

    return {
      subject: `📊 Your Weekly TCG Digest`,
      html,
      text,
    };
  }

  /**
   * Get email template by type
   */
  getTemplate(type: string, data: EmailTemplateData): EmailTemplate {
    const templates: Record<
      string,
      (data: EmailTemplateData) => EmailTemplate
    > = {
      streamStarted: this.streamStarted.bind(this),
      streamEnded: this.streamEnded.bind(this),
      collaborationInvite: this.collaborationInvite.bind(this),
      raidIncoming: this.raidIncoming.bind(this),
      eventReminders: this.eventReminders.bind(this),
      friendRequests: this.friendRequests.bind(this),
      tournamentUpdates: this.tournamentUpdates.bind(this),
      systemAnnouncements: this.systemAnnouncements.bind(this),
      weeklyDigest: this.weeklyDigest.bind(this),
    };

    const generator = templates[type];
    if (!generator) {
      // Default template for unknown types
      return this.systemAnnouncements({
        announcementTitle: data.announcementTitle || "Notification",
        announcementMessage:
          data.announcementMessage || "You have a new notification.",
        announcementUrl: data.announcementUrl || "#",
        unsubscribeUrl: data.unsubscribeUrl || "#",
      });
    }

    return generator(data);
  }
}

// Export singleton instance
export const emailTemplatesService = new EmailTemplatesService();
