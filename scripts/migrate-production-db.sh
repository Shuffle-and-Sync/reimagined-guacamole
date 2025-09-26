#!/bin/bash

# Production database migration script
# This script safely applies database migrations to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if DATABASE_URL is set
check_database_url() {
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is required"
        print_status "Please set DATABASE_URL with your production database connection string"
        exit 1
    fi
    
    print_success "DATABASE_URL is configured"
}

# Backup database before migration
backup_database() {
    print_status "Creating database backup..."
    
    local backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Extract database details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    local db_details=$(echo $DATABASE_URL | sed 's/postgresql:\/\///')
    local user_pass=$(echo $db_details | cut -d'@' -f1)
    local host_port_db=$(echo $db_details | cut -d'@' -f2)
    local user=$(echo $user_pass | cut -d':' -f1)
    local password=$(echo $user_pass | cut -d':' -f2)
    local host=$(echo $host_port_db | cut -d':' -f1)
    local port_db=$(echo $host_port_db | cut -d':' -f2)
    local port=$(echo $port_db | cut -d'/' -f1)
    local database=$(echo $port_db | cut -d'/' -f2)
    
    print_status "Backing up database '$database' to '$backup_name'"
    
    PGPASSWORD=$password pg_dump \
        -h $host \
        -p $port \
        -U $user \
        -d $database \
        --no-password \
        --verbose \
        > $backup_name || {
        print_error "Backup failed"
        exit 1
    }
    
    print_success "Database backup created: $backup_name"
    echo "BACKUP_FILE=$backup_name" >> backup_info.txt
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    npm run db:health || {
        print_error "Database connection test failed"
        exit 1
    }
    
    print_success "Database connection verified"
}

# Apply migrations using Drizzle
apply_migrations() {
    print_status "Applying database migrations..."
    
    print_warning "This will modify the production database schema"
    print_warning "Make sure you have tested these migrations in a staging environment"
    
    read -p "Continue with migrations? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled by user"
        exit 0
    fi
    
    # Apply migrations
    npm run db:push || {
        print_error "Migration failed"
        print_error "Database may be in an inconsistent state"
        print_status "You may need to restore from backup: $backup_name"
        exit 1
    }
    
    print_success "Migrations applied successfully"
}

# Verify migration success
verify_migration() {
    print_status "Verifying migration success..."
    
    # Test basic database operations
    npm run db:health || {
        print_error "Post-migration health check failed"
        exit 1
    }
    
    print_success "Migration verification completed"
}

# Clean up old backup files (keep last 5)
cleanup_backups() {
    print_status "Cleaning up old backup files..."
    
    # Keep only the 5 most recent backup files
    ls -t backup_*.sql 2>/dev/null | tail -n +6 | xargs -r rm
    
    print_success "Backup cleanup completed"
}

# Main migration process
main() {
    echo "🗄️  Starting production database migration"
    echo "==========================================="
    
    check_database_url
    test_connection
    backup_database
    apply_migrations
    verify_migration
    cleanup_backups
    
    echo ""
    echo "✅ Database migration completed successfully!"
    echo "📁 Backup saved as: $(cat backup_info.txt | grep BACKUP_FILE | cut -d'=' -f2)"
}

# Script arguments
case "${1:-}" in
    --backup-only)
        print_status "Creating backup only..."
        check_database_url
        test_connection
        backup_database
        ;;
    --migrate-only)
        print_warning "Applying migrations without backup (not recommended)"
        check_database_url
        test_connection
        apply_migrations
        verify_migration
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --backup-only    Create database backup only"
        echo "  --migrate-only   Apply migrations without backup (not recommended)"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  DATABASE_URL     PostgreSQL connection string (required)"
        exit 0
        ;;
    *)
        main
        ;;
esac