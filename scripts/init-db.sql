-- Database initialization script for production testing
-- This script sets up basic database configuration

-- Create additional database user if needed
-- (This is just for local testing, production will use Cloud SQL managed users)

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE shuffleandsync_prod TO shufflesync;

-- Set timezone to UTC (recommended for production)
SET timezone = 'UTC';

-- Enable necessary extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log successful initialization
SELECT 'Database initialized successfully' as status;