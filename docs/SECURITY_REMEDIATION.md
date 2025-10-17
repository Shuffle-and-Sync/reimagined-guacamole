# Security Remediation Guide: Removing Sensitive Data from Git History

## Overview

This guide provides step-by-step instructions for repository administrators to safely and completely remove sensitive files and commits from the Git history of the Shuffle & Sync repository. This addresses the critical security vulnerability where production credentials may have been exposed in `.env.production` file and specific commits.

**⚠️ CRITICAL: This guide is for repository administrators only. History rewriting affects all contributors and requires careful coordination.**

## Background

The test suite identified that the following items may exist in Git history:
- `.env.production` file containing production credentials
- Problematic commit: `452a970b41758f0ae22e9adc578dd49b9adb815a`

Even though these files may not exist in the current working tree, they could still be accessible in Git history, which poses a security risk.

## Quick Start for Windows Users

If you're on Windows and have already rotated credentials, here's the streamlined process:

1. **Install Python** (if not already installed): Download from [python.org](https://www.python.org/downloads/)
2. **Install git-filter-repo**: Open PowerShell and run:
   ```powershell
   pip install git-filter-repo
   ```
3. **Create a backup clone**:
   ```powershell
   cd $env:TEMP
   git clone --mirror https://github.com/Shuffle-and-Sync/reimagined-guacamole.git repo-cleanup
   cd repo-cleanup
   ```
4. **Remove the problematic commit**:
   ```powershell
   git filter-repo --invert-paths --path .env.production --force
   ```
5. **Force push** (after team coordination):
   ```powershell
   git push --force --all origin
   git push --force --tags origin
   ```

For detailed instructions with safety checks, continue reading below.

## Prerequisites

Before starting this process, ensure you have:

1. **Administrator Access**: Full access to the repository and permissions to force-push
2. **Team Coordination**: All team members must be notified and prepared to re-clone the repository
3. **Backup**: Complete backup of the repository before proceeding
4. **Git Filter-Repo Tool**: Installed on your system (instructions below)
5. **Time Window**: Schedule during low-activity period to minimize disruption

## Step 1: Install git-filter-repo

### On macOS (using Homebrew)
```bash
brew install git-filter-repo
```

### On Linux (using pip)
```bash
pip3 install git-filter-repo
```

### On Windows

#### Option 1: Using pip (Recommended)
If you have Python installed on Windows:

```powershell
# Open PowerShell or Command Prompt
pip install git-filter-repo
```

If the command is not found after installation, you may need to add Python Scripts to your PATH:
```powershell
# Find where pip installed git-filter-repo
python -m pip show -f git-filter-repo

# Add Python Scripts directory to PATH (typically):
# C:\Users\YourUsername\AppData\Local\Programs\Python\Python3x\Scripts
```

#### Option 2: Manual Installation on Windows
```powershell
# Download the script using PowerShell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo" -OutFile "git-filter-repo"

# Move to a directory in your PATH (Git's usr/bin is recommended)
# Find your Git installation directory (usually C:\Program Files\Git\usr\bin)
Move-Item -Path "git-filter-repo" -Destination "C:\Program Files\Git\usr\bin\git-filter-repo"

# Or create a batch file wrapper:
# Create git-filter-repo.bat in C:\Program Files\Git\cmd\
# with content: @python "C:\Program Files\Git\usr\bin\git-filter-repo" %*
```

**Note for Windows Users**: 
- Ensure Python is installed (download from python.org if needed)
- Run PowerShell as Administrator for installation
- Git for Windows should be installed (git-scm.com)

### Manual Installation (Linux/macOS)
```bash
# Download the script
curl -o git-filter-repo https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo

# Make it executable
chmod +x git-filter-repo

# Move to a directory in your PATH
sudo mv git-filter-repo /usr/local/bin/
```

### Verify Installation
```bash
git filter-repo --version
```

## Step 2: Prepare Your Environment

### 2.1 Create a Fresh Clone
**Important**: Do NOT use your existing working copy. Create a fresh clone specifically for this operation.

**On Linux/macOS:**
```bash
# Navigate to a temporary directory
cd /tmp

# Create a fresh clone (replace with your repository URL)
git clone --mirror https://github.com/Shuffle-and-Sync/reimagined-guacamole.git repo-cleanup
cd repo-cleanup
```

**On Windows (PowerShell):**
```powershell
# Navigate to a temporary directory
cd $env:TEMP

# Create a fresh clone (replace with your repository URL)
git clone --mirror https://github.com/Shuffle-and-Sync/reimagined-guacamole.git repo-cleanup
cd repo-cleanup
```

**Note**: The `--mirror` flag creates a bare repository that includes all branches, tags, and refs.

### 2.2 Create a Backup

**On Linux/macOS:**
```bash
# Create a backup of the repository
cd ..
tar -czf repo-backup-$(date +%Y%m%d-%H%M%S).tar.gz repo-cleanup/
```

**On Windows (PowerShell):**
```powershell
# Create a backup of the repository
cd ..
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
Compress-Archive -Path repo-cleanup -DestinationPath "repo-backup-$timestamp.zip"
```

**Store this backup in a secure location. You can use it to restore if something goes wrong.**

## Step 3: Remove Sensitive Files from History

### 3.1 Remove .env.production File

Navigate to your cloned repository and run:

**On Linux/macOS:**
```bash
cd /tmp/repo-cleanup

# Remove .env.production from all commits
git filter-repo --invert-paths --path .env.production --force
```

**On Windows (PowerShell):**
```powershell
cd $env:TEMP\repo-cleanup

# Remove .env.production from all commits
git filter-repo --invert-paths --path .env.production --force
```

**What this does:**
- `--invert-paths`: Removes the specified path instead of keeping it
- `--path .env.production`: Specifies the file to remove
- `--force`: Allows operation on a bare/mirror repository

### 3.2 Remove Specific Problematic Commit (If Needed)

If the commit `452a970b41758f0ae22e9adc578dd49b9adb815a` still exists and contains sensitive data:

**On Linux/macOS:**
```bash
# First, verify the commit exists
git log --all --oneline | grep 452a970b4175

# If it exists, you can remove it by filtering out the specific changes
# This requires identifying what made the commit problematic
git filter-repo --commit-callback '
  if commit.original_id == b"452a970b41758f0ae22e9adc578dd49b9adb815a":
    commit.skip()
' --force
```

**On Windows (PowerShell):**
```powershell
# First, verify the commit exists
git log --all --oneline | Select-String "452a970b4175"

# If it exists, you can remove it by filtering out the specific changes
# Create a callback script file first for easier execution
$callback = @'
if commit.original_id == b"452a970b41758f0ae22e9adc578dd49b9adb815a":
    commit.skip()
'@
$callback | Out-File -FilePath callback.py -Encoding ASCII

# Run git filter-repo with the callback
git filter-repo --commit-callback "`$(Get-Content callback.py -Raw)" --force
```

**Alternative Approach**: If you know the date range when sensitive data was committed:

```bash
# List commits in a date range to identify problematic ones
git log --all --since="2024-01-01" --until="2024-02-01" --pretty=format:"%H %s" -- .env.production
```

### 3.3 Remove Any Other .env Files (Comprehensive Cleanup)

To ensure no other environment files with credentials exist in history:

```bash
# Remove all .env files except templates and examples
git filter-repo --invert-paths \
  --path-regex '^\.env($|\..+)' \
  --path-regex '.*\.env$' \
  --path-regex '.*\.env\..+' \
  --force
```

Then restore the safe template files:

```bash
# The repository should already have .env.example and .env.production.template
# which are safe and should remain
```

## Step 4: Verify the Cleanup

### 4.1 Check File Removal
```bash
# Verify .env.production is completely removed from history
git log --all --full-history -- .env.production

# This should return no results
```

### 4.2 Check Commit Removal
```bash
# Verify the problematic commit is gone
git show 452a970b41758f0ae22e9adc578dd49b9adb815a

# Should show: "fatal: bad object 452a970b41758f0ae22e9adc578dd49b9adb815a"
```

### 4.3 Search for Sensitive Patterns
```bash
# Search for potential API keys or secrets in history
git log --all -p | grep -i "api[_-]key"
git log --all -p | grep -i "secret"
git log --all -p | grep -i "password"

# Review any matches to ensure no sensitive data remains
```

## Step 5: Force Push the Cleaned History

**⚠️ CRITICAL WARNING**: This step will rewrite the repository history for all collaborators.

### 5.1 Notify All Team Members
Before proceeding, send a notification to all contributors:

```
URGENT: Repository History Rewrite in Progress

The repository history will be rewritten to remove sensitive data.

After the update:
1. Do NOT push any changes until the cleanup is complete
2. Save any uncommitted work
3. Delete your local clones
4. Clone the repository fresh after the cleanup
5. Do NOT use git pull - it will not work properly

Timeline: [Specify your timeline]
```

### 5.2 Push the Cleaned Repository

```bash
# Push all refs to the origin
git push --force --all origin
git push --force --tags origin
```

### 5.3 Verify Remote Repository
```bash
# Clone the repository fresh and verify
cd /tmp
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git verify-cleanup
cd verify-cleanup

# Run verification tests
git log --all --full-history -- .env.production
git show 452a970b41758f0ae22e9adc578dd49b9adb815a
```

## Step 6: Rotate All Exposed Credentials

Even after removing files from Git history, you must assume the credentials were compromised.

### 6.1 Credentials to Rotate Immediately

Based on typical `.env.production` contents, rotate:

- **Database credentials**: Change `DATABASE_URL` and all database passwords
- **OAuth secrets**: Regenerate `GOOGLE_CLIENT_SECRET` and other OAuth credentials  
- **API keys**: Regenerate all third-party API keys (SendGrid, Twitch, YouTube, etc.)
- **Auth secrets**: Generate new `AUTH_SECRET` value
- **Webhook tokens**: Regenerate `YOUTUBE_WEBHOOK_VERIFY_TOKEN` and similar tokens
- **Session secrets**: Update all session-related secrets

### 6.2 Update Production Environment

```bash
# Update environment variables in your deployment platform
# For Google Cloud Run:
gcloud run services update shuffle-and-sync \
  --set-env-vars="AUTH_SECRET=new_secure_value" \
  --set-env-vars="DATABASE_URL=new_database_url" \
  # ... (add all other updated credentials)

# For other platforms, follow their documentation for updating secrets
```

### 6.3 Invalidate Active Sessions

After rotating credentials, invalidate all active user sessions:

```sql
-- Connect to your database and clear sessions
DELETE FROM sessions;
```

Users will need to log in again with the new credentials.

## Step 7: Team Cleanup Instructions

Provide these instructions to all team members:

### For All Contributors

```bash
# 1. Save any uncommitted work to a separate location

# 2. Delete your local repository
cd ~/projects
rm -rf reimagined-guacamole

# 3. Clone fresh from the cleaned repository
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole

# 4. Install dependencies
npm install --legacy-peer-deps

# 5. Set up your local environment
cp .env.example .env.local
# Edit .env.local with your local development credentials

# 6. Verify the cleanup worked
npm run test -- server/tests/security/gitignore-env-protection.test.ts
```

### Common Issues

**"I have unpushed commits, what do I do?"**
1. Create patches of your commits: `git format-patch origin/main`
2. Delete your local repository
3. Clone fresh
4. Apply patches: `git am *.patch`
5. Review and commit

**"Git says 'diverged histories'"**
- Do NOT try to merge or pull
- Delete your local clone and clone fresh
- This is expected after history rewriting

## Step 8: Update Security Policies

### 8.1 Update .gitignore (Already Done)
The repository already has comprehensive `.gitignore` rules:
```gitignore
# Broad patterns to prevent ANY .env files
*.env*
.env*
# Allow templates only
!.env.example
!.env.production.template
```

### 8.2 Add Pre-Commit Hooks (Recommended)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for .env files (except templates)
if git diff --cached --name-only | grep -E '\.env($|\.[^.]+$)' | grep -v -E '\.(example|template)$'; then
  echo "ERROR: Attempting to commit .env file!"
  echo "Blocked files:"
  git diff --cached --name-only | grep -E '\.env($|\.[^.]+$)' | grep -v -E '\.(example|template)$'
  exit 1
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### 8.3 Enable GitHub Secret Scanning

1. Go to repository Settings → Security → Code security and analysis
2. Enable "Secret scanning"
3. Enable "Push protection" to prevent future credential commits

## Step 9: Verification and Testing

### 9.1 Run Security Tests

```bash
# Run the security test suite
npm test -- server/tests/security/

# Specifically run the gitignore protection test
npm test -- server/tests/security/gitignore-env-protection.test.ts
```

All tests should pass, including:
- ✅ `.env.production` should not exist in Git history
- ✅ Specific problematic commit should not exist
- ✅ `.gitignore` should contain broad `.env` patterns

### 9.2 Manual Verification Checklist

- [ ] `.env.production` removed from all history: `git log --all --full-history -- .env.production` returns nothing
- [ ] Problematic commit removed: `git show 452a970b41758f0ae22e9adc578dd49b9adb815a` shows "bad object"
- [ ] No sensitive patterns in history: Manual grep searches return no sensitive data
- [ ] All credentials rotated in production environment
- [ ] Active sessions invalidated
- [ ] All team members have fresh clones
- [ ] Security tests pass
- [ ] GitHub secret scanning enabled

## Troubleshooting

### Issue: "git-filter-repo not found"
**Solution**: Ensure git-filter-repo is installed and in your PATH. See Step 1.

### Issue: "Remote rejected (shallow update not allowed)"
**Solution**: You're working with a shallow clone. Use `--mirror` when cloning as shown in Step 2.1.

### Issue: "Cannot force-push (protected branch)"
**Solution**: Temporarily disable branch protection rules in GitHub:
1. Go to Settings → Branches
2. Edit branch protection rule for `main`
3. Temporarily disable protection
4. Force push
5. Re-enable protection immediately after

### Issue: "Team member's repository is broken after update"
**Solution**: They must delete their local clone completely and clone fresh. Do NOT use `git pull`.

### Issue: "Lost commits after cleanup"
**Solution**: Restore from the backup created in Step 2.2:
```bash
cd /tmp
tar -xzf repo-backup-*.tar.gz
# Review and extract needed commits
```

## Post-Cleanup Monitoring

### Ongoing Security Measures

1. **Regular Security Audits**: Run security tests as part of CI/CD
2. **Secret Scanning**: Monitor GitHub secret scanning alerts
3. **Access Logs**: Review who accessed production credentials
4. **Credential Rotation**: Rotate credentials every 90 days
5. **Team Training**: Educate team on secure credential management

### Monitoring Commands

```bash
# Regular check for .env files in commits
git log --all --oneline --name-only | grep '\.env' | grep -v -E '\.(example|template)$'

# Check recent commits for patterns that look like secrets
git log --all -p --since="1 week ago" | grep -E '(password|secret|key|token).*=.*[a-zA-Z0-9]{20,}'
```

## References

- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Security Best Practices](./SECURITY_IMPROVEMENTS.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)

## Summary Checklist

Complete this checklist when performing the remediation:

- [ ] Installed git-filter-repo
- [ ] Created fresh mirror clone
- [ ] Created backup of repository
- [ ] Removed sensitive files from history
- [ ] Verified files are completely removed
- [ ] Notified all team members
- [ ] Force-pushed cleaned history
- [ ] Verified remote repository
- [ ] Rotated all exposed credentials
- [ ] Updated production environment
- [ ] Invalidated active sessions
- [ ] All team members have fresh clones
- [ ] Security tests pass
- [ ] GitHub secret scanning enabled
- [ ] Pre-commit hooks installed (recommended)
- [ ] Post-cleanup monitoring in place
- [ ] Documentation updated

---

**Last Updated**: 2024-10-17  
**Applies To**: Shuffle & Sync Repository  
**Severity**: Critical  
**Status**: Remediation Guide Ready

For questions or issues during this process, contact the repository administrators immediately.
