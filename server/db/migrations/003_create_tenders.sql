-- RENAME ONLY: this file was previously 002_create_tenders.sql
-- Content identical to previous 002_create_tenders.sql output

CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    issuing_entity_id UUID REFERENCES users(id),
    sector TEXT,
    value NUMERIC,
    closing_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('open','under-review','awarded','completed','cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tenders_fts ON tenders USING GIN(to_tsvector('english', title || ' ' || COALESCE(description,'')));

-- Create seed ministries as users
INSERT INTO users (email, password_hash, full_name, user_type, entity_name)
VALUES
  ('infrastructure@gov.ke', 'seed', 'Ministry of Infrastructure', 'government_entity', 'Ministry of Infrastructure'),
  ('health@gov.ke', 'seed', 'Ministry of Health', 'government_entity', 'Ministry of Health'),
  ('education@gov.ke', 'seed', 'Ministry of Education', 'government_entity', 'Ministry of Education'),
  ('ict@gov.ke', 'seed', 'Ministry of ICT', 'government_entity', 'Ministry of ICT'),
  ('agriculture@gov.ke', 'seed', 'Ministry of Agriculture', 'government_entity', 'Ministry of Agriculture'),
  ('defense@gov.ke', 'seed', 'Ministry of Defense', 'government_entity', 'Ministry of Defense'),
  ('water@gov.ke', 'seed', 'Ministry of Water', 'government_entity', 'Ministry of Water'),
  ('transport@gov.ke', 'seed', 'Ministry of Transport', 'government_entity', 'Ministry of Transport')
ON CONFLICT (email) DO NOTHING;

-- Seed tenders
INSERT INTO tenders (reference_number, title, closing_date, value, status, sector, issuing_entity_id)
VALUES
  ('KE-MOI-2023-001', 'Supply and Installation of Traffic Management System in Nairobi CBD', '2023-05-10T00:00:00Z', 320000000, 'awarded', 'Infrastructure', (SELECT id FROM users WHERE email = 'infrastructure@gov.ke')),
  ('KE-MOH-2023-045', 'Construction of County Referral Hospital in Machakos', '2023-06-15T00:00:00Z', 450000000, 'under-review', 'Healthcare', (SELECT id FROM users WHERE email = 'health@gov.ke')),
  ('KE-MOE-2023-078', 'Supply of Educational Materials for Primary Schools', '2023-05-05T00:00:00Z', 120000000, 'completed', 'Education', (SELECT id FROM users WHERE email = 'education@gov.ke')),
  ('KE-MOICT-2023-034', 'National Data Center Expansion Project', '2023-07-20T00:00:00Z', 280000000, 'open', 'ICT', (SELECT id FROM users WHERE email = 'ict@gov.ke')),
  ('KE-MOA-2023-056', 'Irrigation System Development in Arid Areas', '2023-06-25T00:00:00Z', 180000000, 'open', 'Agriculture', (SELECT id FROM users WHERE email = 'agriculture@gov.ke')),
  ('KE-MOD-2023-012', 'Supply of Security Equipment for Border Control', '2023-05-30T00:00:00Z', 350000000, 'under-review', 'Security', (SELECT id FROM users WHERE email = 'defense@gov.ke')),
  ('KE-MOW-2023-089', 'Water Supply and Sanitation Project in Nakuru', '2023-07-15T00:00:00Z', 220000000, 'open', 'Infrastructure', (SELECT id FROM users WHERE email = 'water@gov.ke')),
  ('KE-MOE-2023-103', 'Construction of Technical Training Institutes', '2023-08-05T00:00:00Z', 380000000, 'open', 'Education', (SELECT id FROM users WHERE email = 'education@gov.ke')),
  ('KE-MOH-2023-067', 'Supply of Medical Equipment for County Hospitals', '2023-06-10T00:00:00Z', 290000000, 'cancelled', 'Healthcare', (SELECT id FROM users WHERE email = 'health@gov.ke')),
  ('KE-MOT-2023-023', 'Road Construction Project: Nairobi-Nakuru Highway Expansion', '2023-07-30T00:00:00Z', 520000000, 'awarded', 'Infrastructure', (SELECT id FROM users WHERE email = 'transport@gov.ke')),
  ('KE-MOICT-2023-048', 'Last Mile Connectivity Project - Fiber Optic Installation', '2023-08-15T00:00:00Z', 180000000, 'open', 'ICT', (SELECT id FROM users WHERE email = 'ict@gov.ke')),
  ('KE-MOA-2023-071', 'Agricultural Machinery Supply for Smallholder Farmers', '2023-07-05T00:00:00Z', 150000000, 'under-review', 'Agriculture', (SELECT id FROM users WHERE email = 'agriculture@gov.ke'))
ON CONFLICT (reference_number) DO NOTHING;
