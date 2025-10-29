/**
 * AI Style Matcher Service
 * Handles streaming style preference matching with behavioral analysis
 */

import { logger } from "../../logger";
import type {
  StreamingStyleData,
  StreamingStyleMatch,
} from "./ai-algorithm-types";

export class AIStyleMatcherService {
  private static instance: AIStyleMatcherService;

  private readonly STYLE_MATCHING_FACTORS = {
    contentDelivery: 0.3,
    communicationStyle: 0.25,
    paceCompatibility: 0.2,
    audienceEngagement: 0.15,
    contentSynergy: 0.1,
  };

  private constructor() {
    logger.debug("AI Style Matcher Service initialized");
  }

  public static getInstance(): AIStyleMatcherService {
    if (!AIStyleMatcherService.instance) {
      AIStyleMatcherService.instance = new AIStyleMatcherService();
    }
    return AIStyleMatcherService.instance;
  }

  /**
   * Analyze streaming style compatibility
   */
  async analyzeStyleMatch(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): Promise<StreamingStyleMatch> {
    try {
      // Content delivery compatibility
      const contentDeliveryCompatibility =
        this.calculateContentDeliveryCompatibility(userStyle, candidateStyle);

      // Communication alignment
      const communicationAlignment = this.calculateCommunicationAlignment(
        userStyle,
        candidateStyle,
      );

      // Pace compatibility
      const paceCompatibility = this.calculatePaceCompatibility(
        userStyle,
        candidateStyle,
      );

      // Audience engagement style
      const audienceEngagementStyle = this.determineAudienceEngagementStyle(
        userStyle,
        candidateStyle,
      );

      // Collaboration types
      const collaborationTypes = this.identifyCollaborationTypes(
        userStyle,
        candidateStyle,
      );

      // Streaming personalities
      const streamingPersonalities = this.analyzeStreamingPersonalities(
        userStyle,
        candidateStyle,
      );

      // Content synergy
      const contentSynergy = this.calculateContentSynergy(
        userStyle,
        candidateStyle,
      );

      // Calculate overall style compatibility
      const styleCompatibility =
        contentDeliveryCompatibility *
          this.STYLE_MATCHING_FACTORS.contentDelivery +
        communicationAlignment *
          this.STYLE_MATCHING_FACTORS.communicationStyle +
        paceCompatibility * this.STYLE_MATCHING_FACTORS.paceCompatibility +
        0.7 * this.STYLE_MATCHING_FACTORS.audienceEngagement +
        contentSynergy * this.STYLE_MATCHING_FACTORS.contentSynergy;

      return {
        styleCompatibility: Math.min(100, styleCompatibility * 100),
        contentSynergy: contentSynergy * 100,
        communicationAlignment: communicationAlignment * 100,
        paceCompatibility: paceCompatibility * 100,
        audienceEngagementStyle,
        collaborationTypes,
        streamingPersonalities,
      };
    } catch (error) {
      logger.error("Style matching analysis failed", {
        error,
        userStyle: userStyle?.pace,
        candidateStyle: candidateStyle?.pace,
      });
      return {
        styleCompatibility: 60,
        contentSynergy: 55,
        communicationAlignment: 60,
        paceCompatibility: 65,
        audienceEngagementStyle: "moderate",
        collaborationTypes: ["casual"],
        streamingPersonalities: ["friendly"],
      };
    }
  }

  private calculateContentDeliveryCompatibility(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    let compatibility = 0.5;

    // Check for complementary content types
    if (userStyle.competitive && candidateStyle.competitive) {
      compatibility += 0.2;
    }

    if (userStyle.educational || candidateStyle.educational) {
      compatibility += 0.15;
    }

    if (userStyle.entertainment && candidateStyle.entertainment) {
      compatibility += 0.15;
    }

    return Math.min(1, compatibility);
  }

  private calculateCommunicationAlignment(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    const userComm = userStyle.communicationStyle || "balanced";
    const candidateComm = candidateStyle.communicationStyle || "balanced";

    if (userComm === candidateComm) {
      return 0.9;
    }

    // Complementary communication styles
    if (
      (userComm === "informative" && candidateComm === "entertaining") ||
      (userComm === "entertaining" && candidateComm === "informative")
    ) {
      return 0.75;
    }

    return 0.6;
  }

  private calculatePaceCompatibility(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    const paceMap = { slow: 1, medium: 2, fast: 3 };
    const userPaceValue = paceMap[userStyle.pace] || 2;
    const candidatePaceValue = paceMap[candidateStyle.pace] || 2;

    const paceDiff = Math.abs(userPaceValue - candidatePaceValue);

    // Similar pace is good, but one level difference is acceptable
    if (paceDiff === 0) {
      return 1.0;
    }
    if (paceDiff === 1) {
      return 0.7;
    }
    return 0.4;
  }

  private determineAudienceEngagementStyle(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string {
    const userEngagement = userStyle.interactivity || "medium";
    const candidateEngagement = candidateStyle.interactivity || "medium";

    if (userEngagement === "high" && candidateEngagement === "high")
      return "highly interactive";
    if (userEngagement === "low" && candidateEngagement === "low")
      return "focused on gameplay";

    return "balanced engagement";
  }

  private identifyCollaborationTypes(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string[] {
    const types: string[] = [];

    if (userStyle.competitive && candidateStyle.competitive) {
      types.push("competitive matches");
      types.push("tournament co-streaming");
    }

    if (userStyle.educational || candidateStyle.educational) {
      types.push("teaching sessions");
      types.push("strategy discussions");
    }

    if (userStyle.entertainment && candidateStyle.entertainment) {
      types.push("casual co-op");
      types.push("community events");
    }

    if (
      (userStyle.professional || candidateStyle.professional) &&
      types.length === 0
    ) {
      types.push("professional collaboration");
    }

    return types.length > 0 ? types : ["general collaboration"];
  }

  private analyzeStreamingPersonalities(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): string[] {
    const personalities: string[] = [];

    if (userStyle.competitive || candidateStyle.competitive) {
      personalities.push("competitive");
    }

    if (userStyle.educational || candidateStyle.educational) {
      personalities.push("educational");
    }

    if (userStyle.entertainment || candidateStyle.entertainment) {
      personalities.push("entertaining");
    }

    if (userStyle.professional || candidateStyle.professional) {
      personalities.push("professional");
    }

    return personalities.length > 0 ? personalities : ["casual", "friendly"];
  }

  private calculateContentSynergy(
    userStyle: StreamingStyleData,
    candidateStyle: StreamingStyleData,
  ): number {
    const userFocus = userStyle.contentFocus || [];
    const candidateFocus = candidateStyle.contentFocus || [];

    if (userFocus.length === 0 || candidateFocus.length === 0) {
      return 0.5;
    }

    const sharedFocus = userFocus.filter((focus) =>
      candidateFocus.includes(focus),
    );
    const allFocus = Array.from(new Set([...userFocus, ...candidateFocus]));

    // Balance between shared and complementary focus
    const overlapRatio =
      sharedFocus.length / Math.min(userFocus.length, candidateFocus.length);
    const diversityRatio =
      allFocus.length / (userFocus.length + candidateFocus.length);

    return overlapRatio * 0.6 + diversityRatio * 0.4;
  }
}

export const aiStyleMatcher = AIStyleMatcherService.getInstance();
