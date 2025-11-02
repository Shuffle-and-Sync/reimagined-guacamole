#!/bin/bash
#
# format-everything.sh
# Automated bulk formatting script for Shuffle & Sync repository
#
# This script applies Prettier formatting to the entire codebase.
# It includes safety checks, backups, and validation steps.
#
# Usage:
#   bash format-everything.sh [--dry-run] [--skip-backup] [--skip-validation]
#
# Options:
#   --dry-run          Show what would be formatted without making changes
#   --skip-backup      Skip creating backup branch (not recommended)
#   --skip-validation  Skip running tests after formatting (not recommended)
#   --help             Show this help message
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_BRANCH="backup/pre-prettier-formatting"
BACKUP_TAG="pre-prettier-formatting"
DRY_RUN=false
SKIP_BACKUP=false
SKIP_VALIDATION=false

# Parse command line arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-validation)
      SKIP_VALIDATION=true
      shift
      ;;
    --help)
      head -n 20 "$0" | tail -n 14
      exit 0
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $arg${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

confirm() {
  read -p "$(echo -e ${YELLOW}$1 [y/N]: ${NC})" -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Operation cancelled by user"
    exit 1
  fi
}

# Main script
main() {
  print_header "🎨 Prettier Bulk Formatting Script"
  
  if [ "$DRY_RUN" = true ]; then
    print_warning "Running in DRY RUN mode - no changes will be made"
  fi
  
  # Step 1: Pre-flight checks
  print_header "Step 1: Pre-flight Checks"
  
  # Check if we're in the right directory
  if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
  fi
  print_success "Found package.json"
  
  # Check if git is available
  if ! command -v git &> /dev/null; then
    print_error "git is not installed or not in PATH"
    exit 1
  fi
  print_success "Git is available"
  
  # Check if we're in a git repository
  if [ ! -d ".git" ]; then
    print_error "Not a git repository"
    exit 1
  fi
  print_success "In git repository"
  
  # Check for uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    git status --short
    confirm "Do you want to continue? Changes will be stashed."
    git stash save "Pre-formatting stash $(date +%Y%m%d_%H%M%S)"
    print_success "Changes stashed"
  else
    print_success "Working directory is clean"
  fi
  
  # Check Node.js and npm
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi
  NODE_VERSION=$(node --version)
  print_success "Node.js $NODE_VERSION is available"
  
  if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
  fi
  NPM_VERSION=$(npm --version)
  print_success "npm $NPM_VERSION is available"
  
  # Check if prettier is available
  if ! npx prettier --version &> /dev/null; then
    print_error "Prettier is not available"
    print_info "Installing Prettier..."
    npm install --save-dev prettier --legacy-peer-deps
  fi
  PRETTIER_VERSION=$(npx prettier --version)
  print_success "Prettier $PRETTIER_VERSION is available"
  
  # Step 2: Create backup
  if [ "$SKIP_BACKUP" = false ]; then
    print_header "Step 2: Creating Backup"
    
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: $CURRENT_BRANCH"
    
    # Create backup branch
    if git show-ref --verify --quiet "refs/heads/$BACKUP_BRANCH"; then
      print_warning "Backup branch $BACKUP_BRANCH already exists"
      confirm "Do you want to overwrite it?"
      git branch -D "$BACKUP_BRANCH"
    fi
    
    if [ "$DRY_RUN" = false ]; then
      git branch "$BACKUP_BRANCH"
      print_success "Created backup branch: $BACKUP_BRANCH"
      
      # Push backup branch to remote
      if git remote | grep -q origin; then
        git push origin "$BACKUP_BRANCH" 2>/dev/null || print_warning "Could not push backup branch to remote"
      fi
    else
      print_info "[DRY RUN] Would create backup branch: $BACKUP_BRANCH"
    fi
    
    # Create backup tag
    if git tag -l | grep -q "^$BACKUP_TAG$"; then
      print_warning "Backup tag $BACKUP_TAG already exists"
      confirm "Do you want to overwrite it?"
      git tag -d "$BACKUP_TAG"
    fi
    
    if [ "$DRY_RUN" = false ]; then
      git tag "$BACKUP_TAG"
      print_success "Created backup tag: $BACKUP_TAG"
      
      # Push tag to remote
      if git remote | grep -q origin; then
        git push origin "$BACKUP_TAG" 2>/dev/null || print_warning "Could not push backup tag to remote"
      fi
    else
      print_info "[DRY RUN] Would create backup tag: $BACKUP_TAG"
    fi
  else
    print_warning "Skipping backup (--skip-backup flag)"
  fi
  
  # Step 3: Check current formatting state
  print_header "Step 3: Checking Current Formatting State"
  
  if npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}" --ignore-path .gitignore > /tmp/prettier-check-before.txt 2>&1; then
    print_success "All files are already formatted!"
    print_info "Nothing to do. Exiting."
    exit 0
  else
    UNFORMATTED_COUNT=$(grep -c "\[warn\]" /tmp/prettier-check-before.txt || echo "0")
    print_warning "$UNFORMATTED_COUNT files need formatting"
    
    if [ $UNFORMATTED_COUNT -gt 100 ]; then
      print_warning "Large number of files to format!"
      confirm "Are you sure you want to continue?"
    fi
  fi
  
  # Step 4: Format all files
  print_header "Step 4: Formatting All Files"
  
  if [ "$DRY_RUN" = true ]; then
    print_info "[DRY RUN] Would format the following files:"
    cat /tmp/prettier-check-before.txt | grep "\[warn\]" | sed 's/\[warn\] /  - /'
  else
    print_info "Running Prettier on all files..."
    
    if npm run format 2>&1 | tee /tmp/prettier-format.log; then
      print_success "Formatting complete"
    else
      print_error "Formatting failed!"
      print_info "Check /tmp/prettier-format.log for details"
      exit 1
    fi
    
    # Verify formatting
    print_info "Verifying formatting..."
    if npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}" --ignore-path .gitignore > /tmp/prettier-check-after.txt 2>&1; then
      print_success "All files are now properly formatted!"
    else
      print_error "Some files still have formatting issues!"
      cat /tmp/prettier-check-after.txt
      exit 1
    fi
  fi
  
  # Step 5: Run validation
  if [ "$SKIP_VALIDATION" = false ] && [ "$DRY_RUN" = false ]; then
    print_header "Step 5: Running Validation"
    
    # TypeScript type checking
    print_info "Running TypeScript type check..."
    if npm run check 2>&1 | tee /tmp/typescript-check.log; then
      print_success "TypeScript check passed"
    else
      print_error "TypeScript check failed!"
      print_warning "Formatting may have revealed existing type errors"
      confirm "Do you want to continue anyway?"
    fi
    
    # ESLint
    print_info "Running ESLint..."
    if npm run lint 2>&1 | tee /tmp/eslint-check.log; then
      print_success "ESLint check passed"
    else
      print_error "ESLint check failed!"
      print_warning "Formatting may have revealed existing lint errors"
      confirm "Do you want to continue anyway?"
    fi
    
    # Tests
    print_info "Running tests..."
    if npm test 2>&1 | tee /tmp/test-results.log; then
      print_success "All tests passed"
    else
      print_error "Tests failed!"
      print_warning "This may indicate formatting broke something"
      confirm "Do you want to continue anyway?"
    fi
    
    # Build
    print_info "Testing build..."
    if npm run build 2>&1 | tee /tmp/build-results.log; then
      print_success "Build succeeded"
    else
      print_error "Build failed!"
      print_warning "This may indicate formatting broke something"
      confirm "Do you want to continue anyway?"
    fi
  elif [ "$SKIP_VALIDATION" = true ]; then
    print_warning "Skipping validation (--skip-validation flag)"
  fi
  
  # Step 6: Summary and next steps
  print_header "Step 6: Summary and Next Steps"
  
  if [ "$DRY_RUN" = false ]; then
    # Show git status
    print_info "Git status:"
    git status --short | head -20
    
    CHANGED_FILES=$(git status --porcelain | wc -l)
    print_info "Total files changed: $CHANGED_FILES"
    
    print_success "Formatting complete!"
    echo ""
    print_info "Next steps:"
    echo "  1. Review the changes: git diff"
    echo "  2. Commit the changes: git commit -m 'chore: apply Prettier formatting'"
    echo "  3. Add commit to .git-blame-ignore-revs"
    echo "  4. Push to remote: git push"
    echo ""
    print_info "Rollback if needed:"
    echo "  - Reset to backup tag: git reset --hard $BACKUP_TAG"
    echo "  - Or checkout backup branch: git checkout $BACKUP_BRANCH"
  else
    print_success "Dry run complete - no changes made"
    echo ""
    print_info "To actually format files, run without --dry-run flag:"
    echo "  bash format-everything.sh"
  fi
}

# Run main function
main

exit 0
