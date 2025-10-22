import QRCode from "qrcode";
import { logger } from "../logger";
import { storage } from "../storage";

export interface GraphicTemplate {
  name: string;
  width: number;
  height: number;
}

export const GRAPHIC_TEMPLATES: Record<string, GraphicTemplate> = {
  modern: { name: "Modern", width: 1200, height: 630 },
  classic: { name: "Classic", width: 1200, height: 630 },
  minimal: { name: "Minimal", width: 1200, height: 630 },
  square: { name: "Square", width: 1080, height: 1080 },
};

export class GraphicsGeneratorService {
  /**
   * Generate promotional graphic for an event
   */
  async generateEventGraphic(
    eventId: string,
    template: keyof typeof GRAPHIC_TEMPLATES = "modern",
    includeQR: boolean = true,
  ): Promise<string> {
    try {
      const event = await storage.getEvent(eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      const templateConfig = GRAPHIC_TEMPLATES[template];
      if (!templateConfig) {
        throw new Error("Invalid template");
      }
      const eventUrl = `${process.env.AUTH_URL || "http://localhost:3000"}/calendar?eventId=${eventId}`;

      // Generate QR code if requested
      let qrCodeDataUrl = "";
      if (includeQR) {
        qrCodeDataUrl = await QRCode.toDataURL(eventUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
      }

      // Generate SVG graphic (using SVG for simplicity instead of canvas/sharp)
      const svg = this.generateSVG(
        event,
        templateConfig,
        qrCodeDataUrl,
        template,
      );

      // Return as data URL
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

      logger.info("Event graphic generated", { eventId, template });
      return svgDataUrl;
    } catch (error) {
      logger.error(
        "Failed to generate event graphic",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId,
          template,
        },
      );
      throw error;
    }
  }

  private generateSVG(
    event: unknown,
    config: GraphicTemplate,
    qrCodeDataUrl: string,
    template: string,
  ): string {
    const { width, height } = config;
    const backgroundColor = this.getTemplateColor(template);
    const textColor = template === "modern" ? "#FFFFFF" : "#000000";

    // Format date
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
        
        <!-- Gradient Overlay -->
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${this.adjustColor(backgroundColor, -20)};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad1)"/>
        
        <!-- Event Type Badge -->
        <rect x="50" y="50" width="200" height="50" rx="25" fill="${this.getEventTypeColor(event.type)}"/>
        <text x="150" y="82" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" font-weight="bold">
          ${event.type.toUpperCase().replace("_", " ")}
        </text>
        
        <!-- Event Title -->
        <text x="${width / 2}" y="220" font-family="Arial, sans-serif" font-size="64" fill="${textColor}" text-anchor="middle" font-weight="bold">
          ${this.truncateText(event.title, 30)}
        </text>
        
        <!-- Date and Time -->
        <text x="${width / 2}" y="300" font-family="Arial, sans-serif" font-size="32" fill="${textColor}" text-anchor="middle">
          ${formattedDate}
        </text>
        <text x="${width / 2}" y="350" font-family="Arial, sans-serif" font-size="36" fill="${textColor}" text-anchor="middle" font-weight="bold">
          ${event.time}
        </text>
        
        <!-- Location -->
        <text x="${width / 2}" y="420" font-family="Arial, sans-serif" font-size="28" fill="${textColor}" text-anchor="middle">
          📍 ${this.truncateText(event.location, 40)}
        </text>
    `;

    // Add pod info for game_pod events
    if (event.type === "game_pod" && event.playerSlots) {
      svg += `
        <!-- Pod Info -->
        <rect x="${width / 2 - 150}" y="460" width="300" height="60" rx="10" fill="rgba(255,255,255,0.2)"/>
        <text x="${width / 2}" y="500" font-family="Arial, sans-serif" font-size="28" fill="${textColor}" text-anchor="middle" font-weight="bold">
          ${event.playerSlots} Player Pod
        </text>
      `;
    }

    // Add QR code if provided
    if (qrCodeDataUrl) {
      svg += `
        <!-- QR Code -->
        <image x="${width - 250}" y="${height - 250}" width="200" height="200" href="${qrCodeDataUrl}"/>
        <text x="${width - 150}" y="${height - 20}" font-family="Arial, sans-serif" font-size="18" fill="${textColor}" text-anchor="middle">
          Scan to RSVP
        </text>
      `;
    }

    svg += `
      </svg>
    `;

    return svg;
  }

  private getTemplateColor(template: string): string {
    const colors: Record<string, string> = {
      modern: "#6366f1", // Indigo
      classic: "#f59e0b", // Amber
      minimal: "#e5e7eb", // Gray
      square: "#8b5cf6", // Purple
    };
    return colors[template] || "#6366f1";
  }

  private getEventTypeColor(type: string): string {
    const colors: Record<string, string> = {
      tournament: "#eab308", // Yellow
      convention: "#a855f7", // Purple
      release: "#3b82f6", // Blue
      game_pod: "#ef4444", // Red
      community: "#22c55e", // Green
    };
    return colors[type] || "#6b7280";
  }

  private adjustColor(color: string, percent: number): string {
    // Simple color adjustment (darkens if negative, lightens if positive)
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }
}

export const graphicsGeneratorService = new GraphicsGeneratorService();
