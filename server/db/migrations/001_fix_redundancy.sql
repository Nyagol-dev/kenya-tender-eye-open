-- Migration: Fix redundancy by removing service_category_id from users
-- Note: entity_name is preserved on the users table for display purposes.
-- Note: Profile creation trigger is removed as it is now handled in the auth controller.

BEGIN;

-- 1. Drop the redundant column from users
ALTER TABLE users DROP COLUMN IF EXISTS service_category_id;

-- 2. Ensure profiles table exists
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  user_type           TEXT,
  full_name           TEXT,
  service_category_id UUID        REFERENCES service_categories(id) ON DELETE SET NULL,
  entity_name         TEXT,
  status              approval_status NOT NULL DEFAULT 'pending',
  is_admin            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backfill columns if profiles already existed with an older schema
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS entity_name  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Remove legacy triggers/functions (now handled in controller)
DROP TRIGGER IF EXISTS create_profile_on_signup ON users;
DROP FUNCTION IF EXISTS create_profile_trigger();

COMMIT;
