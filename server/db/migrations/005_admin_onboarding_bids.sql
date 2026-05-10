-- TABLE 1: admin_users
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin','admin')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 2: supplier_onboarding
CREATE TABLE supplier_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','in_progress','submitted','approved',
                      'rejected','expired')),
  deadline TIMESTAMPTZ NOT NULL,  -- set to created_at + 48 hours
  step_completed INTEGER DEFAULT 0,  -- tracks which step (1-4) they finished
  
  -- Step 1: Business details
  business_name TEXT,
  business_type TEXT CHECK (business_type IN ('sole_proprietor','partnership',
    'limited_company','cooperative','ngo','other')),
  registration_number TEXT,
  kra_pin TEXT,
  years_in_operation INTEGER,
  number_of_employees INTEGER,
  
  -- Step 2: Service confirmation
  primary_service_category_id UUID REFERENCES service_categories(id),
  secondary_categories TEXT[],  -- array of category names
  counties_of_operation TEXT[],  -- Kenya counties they operate in
  max_contract_value NUMERIC,  -- max contract value they can handle (KES)
  
  -- Step 3: Previous work (stored as JSONB array)
  previous_projects JSONB DEFAULT '[]'::jsonb,
  -- Each item: {title, client, value, year, duration_months, description}
  
  -- Step 4: Admin review
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 3: onboarding_documents
CREATE TABLE onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES supplier_onboarding(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'certificate_of_incorporation',
    'kra_tax_compliance',
    'cr12_form',
    'audited_accounts',
    'bank_statement',
    'business_permit',
    'nca_certificate',      -- National Construction Authority (if applicable)
    'previous_contract_evidence',
    'director_id',
    'other'
  )),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,    -- S3/storage URL (use placeholder path for now)
  file_size_bytes INTEGER,
  mime_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 4: bids
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(tender_id, supplier_id),   -- one bid per supplier per tender
  
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','shortlisted',
                      'awarded','rejected','withdrawn')),
  
  bid_amount NUMERIC NOT NULL,
  bid_currency TEXT DEFAULT 'KES',
  technical_proposal TEXT,
  completion_timeline_days INTEGER,
  
  -- Documents attached to this specific bid
  bid_documents JSONB DEFAULT '[]'::jsonb,
  -- Each: {document_type, file_name, file_url, uploaded_at}
  
  -- Admin review
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 5: admin_activity_log
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  action_type TEXT NOT NULL,  
    -- e.g. 'approve_supplier','reject_supplier','approve_bid','reject_bid',
    --      'delete_account','login','logout'
  target_type TEXT,  -- 'supplier','bid','tender','onboarding'
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_supplier_onboarding_user_status_deadline ON supplier_onboarding(user_id, status, deadline);
CREATE INDEX idx_onboarding_documents_onboarding_user_type ON onboarding_documents(onboarding_id, user_id, document_type);
CREATE INDEX idx_bids_tender_supplier_status ON bids(tender_id, supplier_id, status);
CREATE INDEX idx_admin_activity_log_admin_created ON admin_activity_log(admin_id, created_at);

-- TRIGGER: Update supplier_onboarding.updated_at on any UPDATE.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_supplier_onboarding_modtime
    BEFORE UPDATE ON supplier_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SEED: Insert one super_admin into admin_users
-- Generate bcrypt hash with: node -e "require('bcrypt').hash('Admin@2024!', 10).then(console.log)"
INSERT INTO admin_users (email, password_hash, full_name, role)
VALUES (
  'admin@eprocurement.go.ke',
  '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', -- HASH_ME:Admin@2024!
  'System Administrator',
  'super_admin'
);
