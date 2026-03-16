-- Migration: 002_add_unique_constraint_cookie_consents
-- Created: 2025-10-22
-- Description: Add unique constraint on cookie_consents (user_id, consent_version)

BEGIN;

-- Add unique constraint for user consent versioning
ALTER TABLE cookie_consents ADD CONSTRAINT uq_cookie_consents_user_version UNIQUE (user_id, consent_version);

-- Record this migration
INSERT INTO schema_migrations (version, name, description) VALUES
    ('002', 'add_unique_constraint_cookie_consents', 'Add unique constraint on cookie_consents (user_id, consent_version)')
ON CONFLICT (version) DO NOTHING;

COMMIT;