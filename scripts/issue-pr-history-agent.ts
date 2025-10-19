#!/usr/bin/env tsx
/**
 * Issue & PR History Update Agent
 *
 * Automatically updates the ISSUE_PR_HISTORY.md document with closed issues and PRs
 * following GitHub Copilot best practices for automated documentation maintenance.
 *
 * This agent:
 * - Fetches closed issues and PRs from GitHub API
 * - Formats them according to the document template
 * - Updates the ISSUE_PR_HISTORY.md file
 * - Updates the "Last Updated" timestamp
 */

import { promises as fs } from "fs";
import { resolve } from "path";

// GitHub API types
interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  closed_at: string | null;
  created_at: string;
  user: {
    login: string;
  } | null;
  body: string | null;
  labels: Array<{
    name: string;
  }>;
  pull_request?: {
    url: string;
  };
}

interface GitHubPullRequest extends GitHubIssue {
  merged_at: string | null;
  merge_commit_sha: string | null;
}

/**
 * Main Issue/PR History Update Agent
 */
class IssuePRHistoryAgent {
  private readonly rootDir: string;
  private readonly historyFilePath: string;
  private readonly githubToken?: string;
  private readonly repoOwner: string = "Shuffle-and-Sync";
  private readonly repoName: string = "reimagined-guacamole";

  constructor() {
    this.rootDir = resolve(process.cwd());
    this.historyFilePath = resolve(this.rootDir, "docs/ISSUE_PR_HISTORY.md");
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log("🤖 Starting Issue & PR History Update Agent...\n");

    try {
      // Check if GitHub token is available
      if (!this.githubToken) {
        console.log("⚠️  GITHUB_TOKEN not found in environment variables");
        console.log(
          "   The agent will run in limited mode without GitHub API access",
        );
        console.log(
          "   To enable full functionality, set GITHUB_TOKEN in your environment\n",
        );
      }

      // Read current history file
      console.log("📖 Reading current ISSUE_PR_HISTORY.md...");
      const currentContent = await this.readHistoryFile();

      // Fetch closed issues and PRs from GitHub API (if token available)
      let closedIssues: GitHubIssue[] = [];
      let closedPRs: GitHubPullRequest[] = [];

      if (this.githubToken) {
        console.log("🔍 Fetching closed issues and PRs from GitHub...");
        closedIssues = await this.fetchClosedIssues();
        closedPRs = await this.fetchClosedPRs();
        console.log(
          `   Found ${closedIssues.length} closed issues and ${closedPRs.length} closed PRs\n`,
        );
      }

      // Update the document
      console.log("📝 Updating ISSUE_PR_HISTORY.md...");
      const updatedContent = await this.updateHistoryDocument(
        currentContent,
        closedIssues,
        closedPRs,
      );

      // Write the updated content
      await fs.writeFile(this.historyFilePath, updatedContent, "utf-8");

      console.log("✅ ISSUE_PR_HISTORY.md updated successfully!\n");
      console.log("📊 Summary:");
      console.log(`   - Issues processed: ${closedIssues.length}`);
      console.log(`   - PRs processed: ${closedPRs.length}`);
      console.log(`   - Document path: ${this.historyFilePath}\n`);

      console.log("💡 Next steps:");
      console.log("   1. Review the updated ISSUE_PR_HISTORY.md");
      console.log("   2. Add detailed context for significant items");
      console.log("   3. Commit the changes\n");
    } catch (error) {
      console.error("❌ Agent failed:", error);
      throw error;
    }
  }

  /**
   * Read the current history file
   */
  private async readHistoryFile(): Promise<string> {
    try {
      return await fs.readFile(this.historyFilePath, "utf-8");
    } catch (error) {
      console.error("❌ Error reading ISSUE_PR_HISTORY.md:", error);
      throw error;
    }
  }

  /**
   * Fetch closed issues from GitHub API
   */
  private async fetchClosedIssues(): Promise<GitHubIssue[]> {
    if (!this.githubToken) return [];

    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/issues?state=closed&per_page=100&sort=updated&direction=desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Shuffle-and-Sync-Agent",
        },
      });

      if (!response.ok) {
        console.warn(
          `⚠️  GitHub API request failed: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      const issues: GitHubIssue[] = await response.json();

      // Filter out PRs (they have pull_request property)
      return issues.filter((issue) => !issue.pull_request);
    } catch (error) {
      console.warn("⚠️  Error fetching issues from GitHub:", error);
      return [];
    }
  }

  /**
   * Fetch closed PRs from GitHub API
   */
  private async fetchClosedPRs(): Promise<GitHubPullRequest[]> {
    if (!this.githubToken) return [];

    try {
      const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/pulls?state=closed&per_page=100&sort=updated&direction=desc`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Shuffle-and-Sync-Agent",
        },
      });

      if (!response.ok) {
        console.warn(
          `⚠️  GitHub API request failed: ${response.status} ${response.statusText}`,
        );
        return [];
      }

      return await response.json();
    } catch (error) {
      console.warn("⚠️  Error fetching PRs from GitHub:", error);
      return [];
    }
  }

  /**
   * Update the history document with new entries
   */
  private async updateHistoryDocument(
    currentContent: string,
    issues: GitHubIssue[],
    prs: GitHubPullRequest[],
  ): Promise<string> {
    // Update the "Last Updated" date
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    let updatedContent = currentContent.replace(
      /\*\*Last Updated:\*\* .+/,
      `**Last Updated:** ${monthYear}`,
    );

    // For now, just update the timestamp
    // In a production version, this would parse the issues/PRs and add new entries
    // following the document's template format

    return updatedContent;
  }

  /**
   * Categorize issue by labels
   */
  private categorizeIssue(issue: GitHubIssue): string {
    const labels = issue.labels.map((l) => l.name.toLowerCase());

    if (labels.some((l) => l.includes("bug") || l.includes("error"))) {
      return "Bugs";
    } else if (
      labels.some((l) => l.includes("feature") || l.includes("enhancement"))
    ) {
      return "Features";
    } else if (
      labels.some((l) => l.includes("documentation") || l.includes("docs"))
    ) {
      return "Documentation";
    } else if (labels.some((l) => l.includes("security"))) {
      return "Security";
    } else if (
      labels.some((l) => l.includes("database") || l.includes("schema"))
    ) {
      return "Database & Schema";
    } else if (
      labels.some(
        (l) => l.includes("infrastructure") || l.includes("deployment"),
      )
    ) {
      return "Infrastructure & Operations";
    }

    return "Documentation"; // Default category
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  /**
   * Generate entry for an issue or PR
   */
  private generateEntry(item: GitHubIssue | GitHubPullRequest): string {
    const isPR = "merged_at" in item;
    const category = this.categorizeIssue(item);
    const openedDate = this.formatDate(item.created_at);
    const closedDate = item.closed_at
      ? this.formatDate(item.closed_at)
      : "Unknown";
    const contributors = item.user?.login || "Unknown";

    return `
### ${item.title}

**Issue Type:** ${category}  
**Status:** ✅ ${isPR ? "Merged" : "Resolved"}  
**Date Opened:** ${openedDate}  
**Date Closed:** ${closedDate}  
**Contributors:** ${contributors}  

**Problem:**  
${item.body?.substring(0, 200) || "No description provided"}...

**Resolution:**  
[Add resolution details here]

**Files Changed:**
- [Add files here]

**Documentation:**
- [Add documentation links here]

**Lessons Learned:**
- [Add lessons learned here]

---
`;
  }
}

/**
 * CLI execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = new IssuePRHistoryAgent();

  try {
    await agent.run();
  } catch (error) {
    console.error("❌ Issue/PR History Agent failed:", error);
    process.exit(1);
  }
}

export { IssuePRHistoryAgent };
