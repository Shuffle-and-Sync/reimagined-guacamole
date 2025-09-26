#!/bin/bash

# Environment Setup Script for Shuffle & Sync
# Helps developers get started quickly with proper environment configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_color $CYAN "🚀 Shuffle & Sync Environment Setup"
    print_color $CYAN "===================================="
    echo ""
}

print_success() {
    print_color $GREEN "✅ $1"
}

print_warning() {
    print_color $YELLOW "⚠️  $1"
}

print_error() {
    print_color $RED "❌ $1"
}

print_info() {
    print_color $BLUE "ℹ️  $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Generate secure random string
generate_secret() {
    local length=${1:-64}
    if command_exists openssl; then
        openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
    else
        # Fallback for systems without openssl
        head /dev/urandom | tr -dc A-Za-z0-9 | head -c $length
    fi
}

# Setup environment file
setup_env_file() {
    local env_file="$PROJECT_ROOT/.env.local"
    local example_file="$PROJECT_ROOT/.env.example"
    
    if [[ -f "$env_file" ]]; then
        print_warning ".env.local already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Keeping existing .env.local file"
            return 0
        fi
    fi
    
    if [[ ! -f "$example_file" ]]; then
        print_error ".env.example file not found!"
        return 1
    fi
    
    print_info "Creating .env.local from .env.example..."
    cp "$example_file" "$env_file"
    
    # Generate secure secrets
    print_info "Generating secure secrets..."
    
    local auth_secret=$(generate_secret 64)
    local session_secret=$(generate_secret 32)
    local stream_key=$(generate_secret 16 | head -c 32)
    
    # Update the .env.local file with generated secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed
        sed -i '' "s/demo-secret-key-for-development-only-not-for-production/$auth_secret/g" "$env_file"
        sed -i '' "s/your-session-secret-different-from-auth-secret/$session_secret/g" "$env_file"
        sed -i '' "s/STREAM_KEY_ENCRYPTION_KEY=/STREAM_KEY_ENCRYPTION_KEY=$stream_key/g" "$env_file"
    else
        # Linux sed
        sed -i "s/demo-secret-key-for-development-only-not-for-production/$auth_secret/g" "$env_file"
        sed -i "s/your-session-secret-different-from-auth-secret/$session_secret/g" "$env_file"
        sed -i "s/STREAM_KEY_ENCRYPTION_KEY=/STREAM_KEY_ENCRYPTION_KEY=$stream_key/g" "$env_file"
    fi
    
    print_success ".env.local created with secure secrets"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js 20+")
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $node_version -lt 18 ]]; then
            missing_deps+=("Node.js 18+ (current: $(node --version))")
        fi
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists psql && ! command_exists docker; then
        print_warning "Neither PostgreSQL nor Docker found. You'll need a database."
    fi
    
    if [[ ${#missing_deps[@]} -eq 0 ]]; then
        print_success "All prerequisites met"
        return 0
    else
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  • $dep"
        done
        return 1
    fi
}

# Setup database
setup_database() {
    print_info "Database setup options:"
    echo "1. Use existing PostgreSQL database"
    echo "2. Set up local PostgreSQL with Docker"
    echo "3. Use cloud database (Supabase, AWS RDS, etc.)"
    echo "4. Skip database setup"
    
    read -p "Choose option (1-4): " -n 1 -r db_choice
    echo
    
    case $db_choice in
        1)
            print_info "Please update DATABASE_URL in .env.local with your existing database connection string"
            print_info "Format: postgresql://username:password@host:port/database_name"
            ;;
        2)
            if ! command_exists docker; then
                print_error "Docker not found. Please install Docker first."
                return 1
            fi
            print_info "Starting PostgreSQL with Docker..."
            docker run --name shufflesync-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=shufflesync_dev -p 5432:5432 -d postgres:15
            print_success "PostgreSQL started on localhost:5432"
            print_info "Database URL: postgresql://postgres:password@localhost:5432/shufflesync_dev"
            ;;
        3)
            print_info "Please sign up for a cloud database service and update DATABASE_URL in .env.local"
            print_info "Recommended: Supabase (https://supabase.com) or AWS RDS"
            ;;
        4)
            print_warning "Skipping database setup. You'll need to configure it manually."
            ;;
    esac
}

# Setup Google OAuth
setup_google_oauth() {
    print_info "Google OAuth setup is required for authentication."
    print_info "Visit: https://console.developers.google.com"
    print_info "1. Create a new project or select existing"
    print_info "2. Enable Google+ API"
    print_info "3. Create OAuth 2.0 credentials"
    print_info "4. Add authorized redirect URI: http://localhost:3000/api/auth/callback/google"
    echo
    read -p "Have you created Google OAuth credentials? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Google Client ID: " google_client_id
        read -p "Enter Google Client Secret: " google_client_secret
        
        local env_file="$PROJECT_ROOT/.env.local"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$google_client_id/g" "$env_file"
            sed -i '' "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$google_client_secret/g" "$env_file"
        else
            sed -i "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$google_client_id/g" "$env_file"
            sed -i "s/GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$google_client_secret/g" "$env_file"
        fi
        
        print_success "Google OAuth credentials configured"
    else
        print_warning "Google OAuth not configured. You'll need to set it up to use authentication."
    fi
}

# Validate environment
validate_environment() {
    print_info "Validating environment configuration..."
    
    cd "$PROJECT_ROOT"
    if npm run env:validate; then
        print_success "Environment validation passed"
        return 0
    else
        print_error "Environment validation failed"
        print_info "Run 'npm run env:validate' to see detailed errors"
        return 1
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    if npm install; then
        print_success "Dependencies installed"
        return 0
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Setup database schema
setup_schema() {
    print_info "Setting up database schema..."
    
    cd "$PROJECT_ROOT"
    if npm run db:push; then
        print_success "Database schema created"
        return 0
    else
        print_error "Failed to create database schema"
        print_info "Make sure your DATABASE_URL is correct and the database is accessible"
        return 1
    fi
}

# Main setup flow
main() {
    print_header
    
    # Check prerequisites
    if ! check_prerequisites; then
        print_error "Please install missing prerequisites and run the script again"
        exit 1
    fi
    
    # Install dependencies first
    if ! install_dependencies; then
        exit 1
    fi
    
    # Setup environment file
    setup_env_file
    
    # Setup database
    setup_database
    
    # Setup Google OAuth
    setup_google_oauth
    
    # Validate environment
    if validate_environment; then
        # Try to setup database schema
        print_info "Attempting to setup database schema..."
        if setup_schema; then
            print_success "Database schema setup complete"
        else
            print_warning "Database schema setup failed. You may need to configure your database first."
        fi
    fi
    
    # Final instructions
    echo ""
    print_color $CYAN "🎉 Setup Complete!"
    print_color $CYAN "=================="
    echo ""
    print_info "Next steps:"
    echo "1. Review and update .env.local with your specific configuration"
    echo "2. Run 'npm run env:validate' to check your configuration"
    echo "3. Run 'npm run dev' to start the development server"
    echo "4. Visit http://localhost:3000 to see your application"
    echo ""
    print_info "For help, see README.md or run 'npm run env:help'"
}

# Run main function
main "$@"