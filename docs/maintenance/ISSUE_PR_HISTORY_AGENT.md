# Issue & PR History Update Agent

## Overview

The Issue & PR History Update Agent is an automated tool that maintains the `docs/ISSUE_PR_HISTORY.md` document by tracking closed issues and pull requests from the GitHub repository.

## Purpose

This agent follows GitHub Copilot best practices to:

- Automatically update the issue/PR history document at the end of each day
- Maintain a comprehensive catalog of resolved work
- Keep the "Last Updated" timestamp current
- Provide a foundation for manual enhancement of significant items

## Architecture

### Agent Design

The agent follows the established pattern used in other Shuffle & Sync agents:

**File:** `scripts/issue-pr-history-agent.ts`

**Key Features:**

- TypeScript implementation with ES modules
- GitHub API integration for fetching closed issues/PRs
- Automatic timestamp updates
- Category-based organization (Bugs, Features, Documentation, etc.)
- Template-based entry generation

### Workflow Automation

**File:** `.github/workflows/update-issue-pr-history.yml`

**Schedule:** Daily at 11:59 PM UTC (end of day)

**Workflow Steps:**

1. Checkout repository
2. Install dependencies
3. Run the update agent
4. Commit changes if document was modified
5. Generate summary report

## Usage

### Manual Execution

Run the agent manually using npm:

```bash
npm run history:update
```

### With GitHub Token

For full functionality with GitHub API access:

```bash
GITHUB_TOKEN=your_token npm run history:update
```

### Automated Execution

The agent runs automatically via GitHub Actions:

- **Schedule:** Daily at 11:59 PM UTC
- **Trigger:** Can also be manually triggered from GitHub Actions UI
- **Permissions:** Automatic via `GITHUB_TOKEN` secret

## Configuration

### Environment Variables

| Variable       | Description                              | Required   |
| -------------- | ---------------------------------------- | ---------- |
| `GITHUB_TOKEN` | GitHub API token for fetching issues/PRs | Optional\* |

\*The agent will run in limited mode without the token, only updating timestamps.

### Repository Settings

The agent is configured for:

- **Repository:** Shuffle-and-Sync/reimagined-guacamole
- **Target Document:** docs/ISSUE_PR_HISTORY.md
- **API Rate Limit:** Respects GitHub API rate limits

## Document Format

The agent maintains the following structure in `ISSUE_PR_HISTORY.md`:

### Header

```markdown
**Last Updated:** [Month Year]  
**Purpose:** Comprehensive catalog of resolved issues and pull requests  
**Status:** Living Document
```

### Entry Template

```markdown
### [Issue/PR Title]

**Issue Type:** [Bug/Feature/Documentation/etc.]  
**Status:** ✅ [Resolved/Merged/Completed]  
**Date Opened:** [Month Year]  
**Date Closed:** [Month Year]  
**Contributors:** [GitHub usernames]

**Problem:**  
[Description of the issue]

**Resolution:**  
[How it was solved]

**Files Changed:**

- [List of key files]

**Documentation:**

- [Links to related docs]

**Lessons Learned:**

- [Key takeaways]
```

## Agent Workflow

```
┌─────────────────────┐
│  GitHub Actions     │
│  Daily at 11:59 PM  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Checkout Code      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Install Deps       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Run Agent          │
│  (fetch issues/PRs) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Update Document    │
│  - Timestamp        │
│  - New entries      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Commit & Push      │
│  (if changed)       │
└─────────────────────┘
```

## Integration with Existing Tools

### Copilot Agent Ecosystem

The Issue/PR History Agent joins other automation tools:

1. **Test Agent** (`scripts/test-agent.ts`)
   - Generates unit tests
   - Command: `npm run test:generate`

2. **Backend Copilot Agent** (`scripts/backend-copilot-cli.ts`)
   - Analyzes backend code
   - Command: `npm run copilot:analyze`

3. **Issue/PR History Agent** (`scripts/issue-pr-history-agent.ts`) ✨ NEW
   - Updates documentation
   - Command: `npm run history:update`

### NPM Scripts

Added to `package.json`:

```json
{
  "scripts": {
    "history:update": "tsx scripts/issue-pr-history-agent.ts"
  }
}
```

## Best Practices

### Agent Design Principles

Following Copilot best practices:

1. **Autonomous Operation**
   - Runs without human intervention
   - Handles errors gracefully
   - Provides clear logging

2. **Idempotent Execution**
   - Can be run multiple times safely
   - Only commits when changes are detected

3. **Clear Communication**
   - Console output with emoji indicators
   - Detailed summary reports
   - GitHub Actions summary

4. **Maintainability**
   - TypeScript for type safety
   - Well-documented code
   - Follows repository patterns

### Manual Enhancement

The agent provides a foundation, but significant items should be manually enhanced:

1. **Review Generated Entries**
   - Add detailed problem descriptions
   - Document resolution steps
   - List affected files
   - Extract lessons learned

2. **Add Context**
   - Link to detailed documentation
   - Reference related issues/PRs
   - Include architectural decisions

3. **Categorize Properly**
   - Verify auto-categorization
   - Adjust sections as needed

## Monitoring

### GitHub Actions

View workflow runs:

1. Go to repository **Actions** tab
2. Select **Update Issue & PR History** workflow
3. View run logs and summaries

### Local Testing

Test the agent locally:

```bash
# Without GitHub token (limited mode)
npm run history:update

# With GitHub token (full functionality)
GITHUB_TOKEN=your_token npm run history:update
```

### Verification

Check the document:

```bash
# View recent changes
git diff docs/ISSUE_PR_HISTORY.md

# View commit history
git log --oneline -- docs/ISSUE_PR_HISTORY.md
```

## Troubleshooting

### Common Issues

**Issue:** Agent fails to fetch issues/PRs

- **Solution:** Verify GITHUB_TOKEN is set and has correct permissions

**Issue:** No changes committed

- **Solution:** Normal if no new closed issues/PRs since last run

**Issue:** Workflow fails

- **Solution:** Check GitHub Actions logs for specific error messages

### Rate Limiting

GitHub API has rate limits:

- **Authenticated:** 5,000 requests/hour
- **Unauthenticated:** 60 requests/hour

The agent respects these limits and handles errors gracefully.

## Future Enhancements

Potential improvements:

1. **Enhanced Parsing**
   - Extract more details from issue/PR bodies
   - Identify related issues automatically
   - Parse commit messages for context

2. **Rich Categorization**
   - Use ML-based categorization
   - Support custom labels
   - Detect architectural changes

3. **Integration**
   - Slack/Discord notifications
   - Weekly summary emails
   - Dashboard integration

4. **Analytics**
   - Track resolution times
   - Identify patterns
   - Generate insights

## Related Documentation

- [ISSUE_PR_HISTORY.md](../docs/ISSUE_PR_HISTORY.md) - The document being maintained
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [Backend Copilot Agent](../docs/backend/BACKEND_COPILOT_AGENT.md) - Related automation
- [Testing Agent](../docs/TESTING_AGENT.md) - Test automation

## Maintainers

This agent is maintained by the Shuffle & Sync team and follows the repository's contribution guidelines.

---

**Last Updated:** October 2025  
**Status:** Active  
**Version:** 1.0.0
