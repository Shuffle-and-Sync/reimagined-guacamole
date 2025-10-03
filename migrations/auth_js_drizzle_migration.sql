-- Migration: Transition from Express sessions to Auth.js sessions with Drizzle adapter
-- This migration renames the old Express sessions table and creates Auth.js tables

-- Step 1: Rename the old sessions table to legacy_sessions
ALTER TABLE IF EXISTS sessions RENAME TO legacy_sessions;

-- Step 2: Create Auth.js accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL,
  provider VARCHAR NOT NULL,
  provider_account_id VARCHAR NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR,
  scope VARCHAR,
  id_token TEXT,
  session_state VARCHAR,
  UNIQUE(provider, provider_account_id)
);

-- Step 3: Create Auth.js sessions table (for database sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR PRIMARY KEY,
  session_token VARCHAR NOT NULL UNIQUE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

-- Step 4: Create Auth.js verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier VARCHAR NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  UNIQUE(identifier, token)
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
