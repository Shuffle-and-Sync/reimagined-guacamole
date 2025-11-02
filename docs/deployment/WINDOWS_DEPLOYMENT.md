# Windows Deployment Guide - Shuffle & Sync

This guide provides comprehensive instructions for deploying Shuffle & Sync on Windows using Git Bash (MINGW64). While the application is fully deployable from Windows, there are some platform-specific considerations to keep in mind.

## 📑 Table of Contents

- [Prerequisites for Windows](#prerequisites-for-windows)
- [Windows-Specific Environment Setup](#windows-specific-environment-setup)
- [Running Deployment Scripts](#running-deployment-scripts)
- [Windows-Specific Commands](#windows-specific-commands)
- [Common Windows Issues](#common-windows-issues)
- [Windows Deployment Checklist](#windows-deployment-checklist)
- [Testing Your Setup](#testing-your-setup)
- [Performance Tips](#performance-tips)
- [Additional Resources](#additional-resources)

---

## Prerequisites for Windows

Before deploying from Windows, ensure you have the following tools installed:

### Required Tools

1. **Git for Windows** (includes Git Bash) - [Download](https://git-scm.com/download/win)
   - Provides the Bash shell environment
   - Includes Unix-like utilities needed by deployment scripts
   - Default installation options are usually sufficient
   - **Verify**: Open Git Bash and run `git --version`

2. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
   - Use the Windows Installer (.msi)
   - Choose the LTS version (Long Term Support)
   - During installation, check the box to "Automatically install necessary tools"
   - **Verify**: `node --version` and `npm --version`
   - Ensure Node.js is added to your system PATH

3. **Google Cloud SDK** - [Download](https://cloud.google.com/sdk/docs/install)
   - Use the Windows installer
   - After installation, initialize: `gcloud init`
   - Authenticate: `gcloud auth login`
   - **Verify**: `gcloud --version`

4. **Docker Desktop for Windows** - [Download](https://www.docker.com/products/docker-desktop)
   - Required for building container images
   - Enable WSL 2 backend for better performance
   - Start Docker Desktop before deployment
   - **Verify**: `docker --version` and `docker ps`

5. **SQLite Cloud CLI** (Optional for local testing)
   - Install via npm: `npm install -g @sqlitecloud/cli`
   - Used for database management and testing

### Optional Tools (Recommended)

- **Windows Terminal** - Enhanced terminal experience ([Microsoft Store](https://aka.ms/terminal))
- **Visual Studio Code** - For editing configuration files ([Download](https://code.visualstudio.com/))
- **Git Credential Manager** - Easier authentication (included with Git for Windows)

---

## Windows-Specific Environment Setup

### Path Conventions

Windows uses different path conventions than Unix systems. Git Bash handles most of this automatically:

```bash
# Unix-style paths (use these in Git Bash)
cd /c/Users/YourName/projects/reimagined-guacamole

# Windows-style paths (for reference)
# C:\Users\YourName\projects\reimagined-guacamole

# Recommended: Use tilde for home directory
cd ~/projects/reimagined-guacamole
```

### Line Endings Configuration

Configure Git to handle line endings properly to avoid script failures:

```bash
# Set line ending handling for this repository
cd ~/projects/reimagined-guacamole
git config core.autocrlf input

# Or globally for all repositories
git config --global core.autocrlf input
```

This ensures shell scripts maintain Unix-style line endings (LF) even on Windows.

### Environment Variables Setup

Setting environment variables in Git Bash:

```bash
# Temporary (current session only)
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Verify
echo $PROJECT_ID

# For permanent environment variables, add to ~/.bashrc:
echo 'export PROJECT_ID="your-gcp-project-id"' >> ~/.bashrc
echo 'export REGION="us-central1"' >> ~/.bashrc
source ~/.bashrc
```

### Creating .env Files

When creating environment files on Windows:

```bash
# Copy template (works in Git Bash)
cp .env.production.template .env.production

# Edit with your preferred editor
notepad .env.production  # Opens in Notepad
code .env.production     # Opens in VS Code (if installed)

# Or use nano/vim in Git Bash
nano .env.production
```

**Important**: Ensure `.env.production` has Unix line endings (LF). Most modern editors handle this automatically when editing in Git Bash.

---

## Running Deployment Scripts

All deployment scripts are designed to work with Git Bash. Always run scripts using `bash`:

```bash
# ✅ Correct: Use bash explicitly
bash scripts/deploy-production.sh

# ✅ Also correct: Ensure script is executable first
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh

# ❌ Avoid: Running without bash may fail
scripts/deploy-production.sh
```

### Full Deployment Example

```bash
# 1. Open Git Bash and navigate to project
cd ~/projects/reimagined-guacamole

# 2. Set required environment variables
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# 3. Ensure Docker Desktop is running
# Check Docker status
docker ps

# 4. Authenticate with Google Cloud
gcloud auth login
gcloud config set project $PROJECT_ID

# 5. Configure Docker for GCR
gcloud auth configure-docker

# 6. Install dependencies
npm install --legacy-peer-deps

# 7. Build the application
npm run build

# 8. Verify the build
npm run build:verify

# 9. Run deployment
bash scripts/deploy-production.sh
```

---

## Windows-Specific Commands

### Secret Generation

```bash
# Using openssl (included with Git for Windows)
openssl rand -base64 64

# Alternative: Using PowerShell (from Git Bash)
powershell.exe -Command "[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))"

# Using Node.js (cross-platform)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### Port Checking

```bash
# Check if port is in use (Git Bash)
netstat -ano | grep :3000

# Alternative: Using PowerShell
powershell.exe -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue"
```

### Process Management

```bash
# Find process by port
netstat -ano | findstr :3000

# Kill process by PID (use PID from netstat output)
taskkill //F //PID <process_id>

# Kill Node.js processes
taskkill //F //IM node.exe
```

---

## Common Windows Issues

### Issue: "command not found" errors

**Symptom**: Commands like `gcloud`, `docker`, or `npm` not found in Git Bash

**Solution**:

1. Ensure tools are installed
2. Add installation directories to PATH:

   ```bash
   # Add to ~/.bashrc
   export PATH="$PATH:/c/Program Files/Google/Cloud SDK/google-cloud-sdk/bin"
   export PATH="$PATH:/c/Program Files/Docker/Docker/resources/bin"
   export PATH="$PATH:/c/Program Files/nodejs"

   # Reload configuration
   source ~/.bashrc
   ```

3. Restart Git Bash after modifying PATH

### Issue: Permission denied on scripts

**Symptom**: `bash: ./script.sh: Permission denied`

**Solution**:

```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Or always use bash explicitly
bash scripts/deploy-production.sh
```

### Issue: Line ending issues

**Symptom**: Scripts fail with `'\r': command not found` or similar errors

**Solution**:

```bash
# Configure Git line endings
git config core.autocrlf input

# Refresh the repository
git rm --cached -r .
git reset --hard

# Or convert specific files
dos2unix scripts/*.sh

# If dos2unix is not available, use sed
sed -i 's/\r$//' scripts/*.sh
```

### Issue: Docker daemon not running

**Symptom**: `Cannot connect to the Docker daemon`

**Solution**:

1. Start Docker Desktop from the Start menu
2. Wait for Docker to fully initialize (check system tray icon - should be green)
3. Verify: `docker ps`
4. If still failing, restart Docker Desktop
5. Check Docker Desktop settings: Ensure WSL 2 backend is enabled

### Issue: npm install failures

**Symptom**: `ERESOLVE unable to resolve dependency tree`

**Solution**:

```bash
# Use legacy peer deps flag (required for this project)
npm install --legacy-peer-deps

# Clean install if issues persist
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: Path too long errors

**Symptom**: Errors about path lengths exceeding Windows limits (260 characters)

**Solution**:

1. Enable long paths in Windows (requires Administrator):

   ```powershell
   # Run in PowerShell as Administrator
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
     -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```

2. Restart your computer for changes to take effect

3. Or clone repository closer to root:
   ```bash
   cd /c/projects  # Instead of /c/Users/YourName/Documents/Projects/...
   git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
   ```

### Issue: Firewall blocking connections

**Symptom**: Connection timeouts when deploying or pulling images

**Solution**:

1. Allow gcloud and Docker through Windows Firewall:
   - Open Windows Defender Firewall
   - Click "Allow an app or feature through Windows Defender Firewall"
   - Add Docker Desktop and Google Cloud SDK

2. Configure proxy if behind corporate firewall:

   ```bash
   # For gcloud
   gcloud config set proxy/type http
   gcloud config set proxy/address proxy.example.com
   gcloud config set proxy/port 8080

   # For Docker: Configure in Docker Desktop
   # Settings > Resources > Proxies
   ```

### Issue: Script execution policy errors

**Symptom**: Errors when accidentally running in PowerShell

**Solution**:

Always use Git Bash for running deployment scripts:

```bash
# ❌ Wrong: PowerShell
powershell .\scripts\deploy-production.sh

# ✅ Correct: Git Bash
bash scripts/deploy-production.sh
```

### Issue: WSL conflicts

**Symptom**: Multiple bash versions causing confusion

**Solution**:

1. Always use Git Bash (not WSL bash) for deployment
2. Check which bash you're using: `which bash`
   - Git Bash: `/usr/bin/bash`
   - WSL: `/mnt/c/...` or similar
3. Open Git Bash explicitly from Start Menu or right-click context menu

---

## Windows Deployment Checklist

Use this checklist to ensure Windows-specific setup is complete:

- [ ] Git for Windows installed with Git Bash
- [ ] Node.js v18+ installed and in PATH
- [ ] npm working correctly (`npm --version`)
- [ ] Google Cloud SDK installed and authenticated
- [ ] Docker Desktop installed and running
- [ ] Docker daemon accessible (`docker ps` works)
- [ ] Line endings configured (`git config core.autocrlf input`)
- [ ] All scripts have Unix line endings (LF, not CRLF)
- [ ] Environment variables set in Git Bash session
- [ ] `.env.production` created and configured
- [ ] Windows Firewall allows gcloud and Docker
- [ ] Long paths enabled (if needed)
- [ ] WSL 2 backend enabled in Docker Desktop (recommended)

---

## Testing Your Setup

Before deploying to production, verify your Windows setup:

```bash
# 1. Check all prerequisites
node --version    # Should show v18 or higher
npm --version     # Should show 9.x or higher
docker --version  # Should show Docker version
gcloud --version  # Should show Google Cloud SDK version

# 2. Test Docker
docker run hello-world  # Should pull and run successfully

# 3. Test gcloud authentication
gcloud auth list  # Should show your authenticated account
gcloud config get-value project  # Should show your project ID

# 4. Test local build
npm install --legacy-peer-deps
npm run build

# 5. Verify build artifacts
npm run build:verify

# 6. Test environment validation
npm run env:validate

# 7. Run type checking
npm run check

# 8. Run tests
npm test

# 9. Test local server
npm run dev
# Visit http://localhost:3000 in your browser
```

---

## Performance Tips

### 1. Use WSL 2 for Docker

Configure Docker Desktop to use WSL 2 backend for significantly better performance:

- Open Docker Desktop
- Go to Settings > General
- Enable "Use the WSL 2 based engine"
- Apply & Restart

### 2. Exclude from Antivirus

Add project directory to Windows Defender exclusions:

1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Manage settings"
4. Scroll to "Exclusions" and click "Add or remove exclusions"
5. Add your project directory (e.g., `C:\projects\reimagined-guacamole`)

### 3. Use SSD

Keep the project on an SSD rather than HDD for:

- Faster npm installs
- Quicker builds
- Better Docker performance

### 4. Optimize System Resources

- Close unnecessary applications during builds and deployments
- Ensure at least 8GB RAM available for Docker
- Configure Docker Desktop memory limits (Settings > Resources)

### 5. Use Git Bash MinTTY

Use the MinTTY terminal (default with Git Bash) instead of Windows Console for:

- Better ANSI color support
- Faster terminal rendering
- Better Unicode support

---

## Additional Resources

### Official Documentation

- **Git for Windows**: [Git for Windows Wiki](https://github.com/git-for-windows/git/wiki)
- **Docker Desktop for Windows**: [Docker Windows Documentation](https://docs.docker.com/desktop/windows/)
- **Google Cloud SDK**: [Windows Installation Guide](https://cloud.google.com/sdk/docs/install#windows)
- **Windows Terminal**: [Microsoft Documentation](https://docs.microsoft.com/en-us/windows/terminal/)
- **Node.js on Windows**: [Node.js Windows Guidelines](https://nodejs.org/en/docs/guides/working-with-different-filesystems/)

### Troubleshooting Resources

- **Main Deployment Guide**: [DEPLOYMENT.md](../../DEPLOYMENT.md)
- **Troubleshooting Guide**: [docs/troubleshooting/README.md](../troubleshooting/README.md)
- **GitHub Issues**: Search for "Windows" label in repository issues

### Community Support

If you encounter Windows-specific issues:

1. **Check Git Bash version**: `git --version` (use latest)
2. **Verify PATH configuration**: `echo $PATH`
3. **Check for WSL/Git Bash conflicts**: Ensure using correct bash (`which bash`)
4. **Review error messages carefully**: Note any Windows-specific paths or errors
5. **Test in clean environment**: Try in a fresh Git Bash session
6. **GitHub Issues**: Include "Windows" in your issue title and provide:
   - Windows version (run `winver`)
   - Git Bash version
   - Node.js version
   - Docker Desktop version
   - Complete error messages

---

## Quick Reference Card

### Essential Commands

```bash
# Check versions
node --version && npm --version && docker --version && gcloud --version

# Install dependencies
npm install --legacy-peer-deps

# Build application
npm run build

# Start development server
npm run dev

# Deploy to production
bash scripts/deploy-production.sh

# Check Docker status
docker ps

# Authenticate with GCP
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Common Fixes

```bash
# Fix line endings
git config core.autocrlf input
git rm --cached -r . && git reset --hard

# Make script executable
chmod +x scripts/*.sh

# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Restart Docker
# Use Docker Desktop system tray icon

# Kill Node processes
taskkill //F //IM node.exe
```

---

## Need Help?

- 📖 **Main Documentation**: Start with [DEPLOYMENT.md](../../DEPLOYMENT.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Shuffle-and-Sync/reimagined-guacamole/discussions)
- 🔒 **Security**: See [SECURITY.md](../../SECURITY.md) for security-related concerns

When reporting Windows-specific issues, please include:

- Windows version (run `winver`)
- Git Bash version
- Node.js and npm versions
- Docker Desktop version
- Complete error messages
- Steps to reproduce

---

**Last Updated**: November 2025  
**Maintained by**: Shuffle & Sync Development Team
