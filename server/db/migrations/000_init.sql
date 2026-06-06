
BEGIN;

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
