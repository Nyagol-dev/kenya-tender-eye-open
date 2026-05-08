-- Migration: Fix service_category_id redundancy
-- Removes service_category_id from users (profiles is the single source of truth).
-- Adds a trigger that automatically creates a minimal profile row on user INSERT,
-- so the application-level profile INSERT can upsert additional fields safely.
--
-- Run order: apply AFTER 001_refresh_tokens.sql (or alongside it if starting fresh).
-- Safe to run multiple times: all statements use IF EXISTS / IF NOT EXISTS guards.

BEGIN;

-- ── 1. Drop the redundant column from users ──────────────────────────────────
ALTER TABLE users DROP COLUMN IF EXISTS service_category_id;

-- ── 2. Ensure profiles table exists with the canonical service_category_id ───
--      (If profiles was already created by your schema, this is a no-op.)
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  user_type           TEXT,
  full_name           TEXT,
  service_category_id UUID        REFERENCES service_categories(id) ON DELETE SET NULL,
  entity_name         TEXT,
  is_admin            BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Trigger function: create a stub profile on every new user INSERT ───────
--      The application-level INSERT will upsert the real data immediately after.
CREATE OR REPLACE FUNCTION trg_create_profile_on_user_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO profiles (id, created_at)
  VALUES (NEW.id, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;   -- idempotent: skip if app already inserted it
  RETURN NEW;
END;
$$;

-- ── 4. Attach the trigger to the users table ─────────────────────────────────
DROP TRIGGER IF EXISTS trg_user_create_profile ON users;

CREATE TRIGGER trg_user_create_profile
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION trg_create_profile_on_user_insert();

COMMIT;
