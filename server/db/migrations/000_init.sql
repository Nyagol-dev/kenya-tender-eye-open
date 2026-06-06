-- ============================================================================
-- 000_init.sql  –  Baseline schema for kenya-tender-eye
-- Creates the foundational tables that all subsequent migrations depend on
-- but were never explicitly created in any migration file.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Note: gen_random_uuid() is a built-in function since PostgreSQL 13.
-- No extensions required.
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 1. users  (core identity table, referenced by every other table)
--
--    Columns derived from:
--      - authController.js   → INSERT (email, password_hash, full_name, user_type, entity_name)
--      - authController.js   → SELECT * FROM users  (login reads password_hash)
--      - tenderController.js → JOIN users for entity_name
--      - adminPortalController.js → SELECT id, email, entity_name, created_at
--      - 001_fix_redundancy.sql   → ALTER TABLE users DROP COLUMN service_category_id
--                                   (the column must exist to be dropped)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT        NOT NULL UNIQUE,
  password_hash       TEXT        NOT NULL,
  full_name           TEXT,
  user_type           TEXT,                              -- 'supplier' | 'government_entity'
  entity_name         TEXT,
  service_category_id UUID,                              -- dropped by 001_fix_redundancy.sql
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 2. service_categories  (lookup table, seeded by seed_categories.js)
--
--    Columns derived from:
--      - serviceCategoryController.js  → SELECT id, name
--      - seed_categories.js            → INSERT (name) … ON CONFLICT (name)
--      - 001_fix_redundancy.sql        → profiles.service_category_id REFERENCES service_categories(id)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  TEXT NOT NULL UNIQUE
);

COMMIT;
