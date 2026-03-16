-- Migration: 001_initial_schema
-- Created: 2025-10-22
-- Description: Initial database schema for traces and cookie consent

BEGIN;

-- Execute the main schema
\i /docker-entrypoint-initdb.d/schema.sql;

-- Create a migration log table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW(),
    description TEXT
);

-- Record this migration
INSERT INTO schema_migrations (version, name, description) VALUES
    ('001', 'initial_schema', 'Initial database schema for traces and cookie consent')
ON CONFLICT (version) DO NOTHING;

COMMIT;