-- Migration 006: Bid Application Onboarding
-- Adds bid_applications and bid_application_documents tables
-- to support the pre-bid onboarding flow with M-Pesa payment.

-- TABLE 1: bid_applications
-- Tracks a supplier's intent to bid on a specific tender,
-- including M-Pesa payment state before document upload is allowed.
CREATE TABLE bid_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'payment_pending'
    CHECK (status IN (
      'payment_pending',
      'payment_confirmed',
      'documents_uploaded',
      'submitted',
      'rejected'
    )),

  -- M-Pesa STK Push tracking
  mpesa_checkout_request_id TEXT,
  mpesa_transaction_code TEXT,
  payment_confirmed_at TIMESTAMPTZ,
  processing_fee NUMERIC NOT NULL DEFAULT 1000,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One application per supplier per tender
  CONSTRAINT uq_bid_applications_tender_supplier UNIQUE (tender_id, supplier_id)
);

-- TABLE 2: bid_application_documents
-- Documents uploaded for a specific bid application after payment confirmation.
CREATE TABLE bid_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES bid_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_bid_applications_supplier_tender
  ON bid_applications(supplier_id, tender_id);

CREATE INDEX idx_bid_application_documents_application
  ON bid_application_documents(application_id);

-- TRIGGER: Auto-update bid_applications.updated_at on any UPDATE.
-- Reuses the update_updated_at_column() function created in migration 005.
CREATE TRIGGER update_bid_applications_modtime
  BEFORE UPDATE ON bid_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
