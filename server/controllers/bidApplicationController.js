const pool = require('../db/pool');
const logger = require('../lib/logger');
const mpesa = require('../lib/mpesa');

// ---------------------------------------------------------------------------
// POST /api/bid-applications
// Initiate a bid application — creates the row & fires an STK Push.
// ---------------------------------------------------------------------------
exports.initiateBidApplication = async (req, res, next) => {
  const { tender_id, phone_number } = req.body;
  const supplierId = req.user.id;

  if (!tender_id || !phone_number) {
    return res.status(400).json({ error: 'tender_id and phone_number are required' });
  }

  try {
    // 1. Tender must exist and be open
    const tenderRes = await pool.query(
      `SELECT id, status, reference_number, closing_date FROM tenders WHERE id = $1`,
      [tender_id]
    );
    if (tenderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tender not found' });
    }
    const tender = tenderRes.rows[0];

    if (tender.status !== 'open') {
      return res.status(400).json({ error: 'Tender is not open for bidding' });
    }

    if (new Date(tender.closing_date) <= new Date()) {
      return res.status(400).json({ error: 'Tender bidding period has closed' });
    }

    // 2. Supplier onboarding must be approved
    const onboardingRes = await pool.query(
      `SELECT id FROM supplier_onboarding WHERE user_id = $1 AND status = 'approved'`,
      [supplierId]
    );
    if (onboardingRes.rows.length === 0) {
      return res.status(403).json({
        error: 'Your supplier profile must be approved before bidding. Complete onboarding first.',
      });
    }

    // 3. Check for existing application on this tender
    const existingRes = await pool.query(
      `SELECT id, status, mpesa_checkout_request_id FROM bid_applications
       WHERE tender_id = $1 AND supplier_id = $2`,
      [tender_id, supplierId]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];

      // If already paid / submitted, don't allow a new one
      if (['payment_confirmed', 'documents_uploaded', 'submitted'].includes(existing.status)) {
        return res.status(409).json({
          error: 'You already have an active application for this tender',
          application_id: existing.id,
          status: existing.status,
        });
      }

      // If still payment_pending, return the existing application
      // so the frontend can retry or resume.
      if (existing.status === 'payment_pending') {
        // Re-initiate STK Push for the existing application
        const stkResponse = await mpesa.initiateSTKPush({
          phoneNumber: phone_number,
          amount: 1000,
          accountReference: tender.reference_number || tender_id,
          transactionDesc: 'Bid Processing Fee',
        });

        await pool.query(
          `UPDATE bid_applications
           SET mpesa_checkout_request_id = $1, updated_at = NOW()
           WHERE id = $2`,
          [stkResponse.CheckoutRequestID, existing.id]
        );

        return res.status(200).json({
          application_id: existing.id,
          checkout_request_id: stkResponse.CheckoutRequestID,
          message: 'STK Push re-sent. Check your phone to complete payment.',
        });
      }
    }

    // 4. Create bid_applications row
    const insertRes = await pool.query(
      `INSERT INTO bid_applications (tender_id, supplier_id, status, processing_fee)
       VALUES ($1, $2, 'payment_pending', 1000)
       RETURNING id`,
      [tender_id, supplierId]
    );
    const applicationId = insertRes.rows[0].id;

    // 5. Initiate M-Pesa STK Push
    const stkResponse = await mpesa.initiateSTKPush({
      phoneNumber: phone_number,
      amount: 1000,
      accountReference: tender.reference_number || tender_id,
      transactionDesc: 'Bid Processing Fee',
    });

    // 6. Persist the CheckoutRequestID
    await pool.query(
      `UPDATE bid_applications SET mpesa_checkout_request_id = $1 WHERE id = $2`,
      [stkResponse.CheckoutRequestID, applicationId]
    );

    logger.info({
      msg: 'Bid application initiated',
      applicationId,
      tenderId: tender_id,
      supplierId,
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });

    return res.status(201).json({
      application_id: applicationId,
      checkout_request_id: stkResponse.CheckoutRequestID,
      message: 'STK Push sent. Check your phone to complete payment.',
    });
  } catch (err) {
    logger.error({ msg: 'initiateBidApplication error', error: err.message });
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/bid-applications/mpesa-callback
// Called by Daraja — NO auth middleware.
// ---------------------------------------------------------------------------
exports.mpesaCallback = async (req, res) => {
  // Always respond 200 to Daraja immediately, regardless of internal outcome
  try {
    const { resultCode, checkoutRequestId, receiptNumber } = mpesa.verifyCallback(req.body);

    logger.info({
      msg: 'M-Pesa callback received',
      resultCode,
      checkoutRequestId,
      receiptNumber,
    });

    if (resultCode === 0) {
      // Payment successful — update the bid application
      const updateRes = await pool.query(
        `UPDATE bid_applications
         SET status = 'payment_confirmed',
             mpesa_transaction_code = $1,
             payment_confirmed_at = NOW(),
             updated_at = NOW()
         WHERE mpesa_checkout_request_id = $2
           AND status = 'payment_pending'
         RETURNING id`,
        [receiptNumber, checkoutRequestId]
      );

      if (updateRes.rows.length === 0) {
        logger.warn({
          msg: 'M-Pesa callback: no matching pending application found',
          checkoutRequestId,
        });
      } else {
        logger.info({
          msg: 'Bid application payment confirmed',
          applicationId: updateRes.rows[0].id,
          receiptNumber,
        });
      }
    } else {
      logger.warn({
        msg: 'M-Pesa payment failed/cancelled by user',
        resultCode,
        checkoutRequestId,
      });
    }
  } catch (err) {
    // Log but never return an error to Daraja
    logger.error({ msg: 'mpesaCallback processing error', error: err.message });
  }

  // Always acknowledge to Daraja
  return res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
};

// ---------------------------------------------------------------------------
// POST /api/bid-applications/:applicationId/documents
// Upload a document for a bid application.
// ---------------------------------------------------------------------------
exports.uploadBidDocument = async (req, res, next) => {
  const { applicationId } = req.params;
  const supplierId = req.user.id;
  const { document_type, file_name, file_url, file_size_bytes, mime_type } = req.body;

  if (!document_type || !file_name || !file_url) {
    return res.status(400).json({ error: 'document_type, file_name, and file_url are required' });
  }

  try {
    // Verify ownership and correct status
    const appRes = await pool.query(
      `SELECT id, status FROM bid_applications
       WHERE id = $1 AND supplier_id = $2`,
      [applicationId, supplierId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bid application not found' });
    }

    const application = appRes.rows[0];

    if (!['payment_confirmed', 'documents_uploaded'].includes(application.status)) {
      return res.status(400).json({
        error: `Cannot upload documents when application status is '${application.status}'. Payment must be confirmed first.`,
      });
    }

    // Insert the document
    const docRes = await pool.query(
      `INSERT INTO bid_application_documents
         (application_id, document_type, file_name, file_url, file_size_bytes, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [applicationId, document_type, file_name, file_url, file_size_bytes || null, mime_type || null]
    );

    // Optionally mark as documents_uploaded
    if (application.status === 'payment_confirmed') {
      await pool.query(
        `UPDATE bid_applications SET status = 'documents_uploaded', updated_at = NOW()
         WHERE id = $1`,
        [applicationId]
      );
    }

    logger.info({
      msg: 'Bid document uploaded',
      applicationId,
      documentType: document_type,
    });

    return res.status(201).json(docRes.rows[0]);
  } catch (err) {
    logger.error({ msg: 'uploadBidDocument error', error: err.message });
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/bid-applications/:applicationId
// Retrieve a single bid application with its documents.
// ---------------------------------------------------------------------------
exports.getMyApplication = async (req, res, next) => {
  const { applicationId } = req.params;
  const supplierId = req.user.id;

  try {
    const appRes = await pool.query(
      `SELECT ba.*,
              t.title            AS tender_title,
              t.reference_number AS tender_reference_number,
              t.closing_date     AS tender_closing_date
       FROM bid_applications ba
       JOIN tenders t ON t.id = ba.tender_id
       WHERE ba.id = $1 AND ba.supplier_id = $2`,
      [applicationId, supplierId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Bid application not found' });
    }

    const application = appRes.rows[0];

    // Fetch associated documents
    const docsRes = await pool.query(
      `SELECT * FROM bid_application_documents
       WHERE application_id = $1
       ORDER BY uploaded_at ASC`,
      [applicationId]
    );

    application.documents = docsRes.rows;

    return res.json(application);
  } catch (err) {
    logger.error({ msg: 'getMyApplication error', error: err.message });
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/bid-applications/tender/:tenderId
// Get application for a specific tender (if any) for the authenticated user.
// ---------------------------------------------------------------------------
exports.getMyApplicationByTender = async (req, res, next) => {
  const { tenderId } = req.params;
  const supplierId = req.user.id;

  try {
    const appRes = await pool.query(
      `SELECT ba.*,
              t.title            AS tender_title,
              t.reference_number AS tender_reference_number,
              t.closing_date     AS tender_closing_date
       FROM bid_applications ba
       JOIN tenders t ON t.id = ba.tender_id
       WHERE ba.tender_id = $1 AND ba.supplier_id = $2`,
      [tenderId, supplierId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'No application found for this tender' });
    }

    const application = appRes.rows[0];

    const docsRes = await pool.query(
      `SELECT * FROM bid_application_documents
       WHERE application_id = $1
       ORDER BY uploaded_at ASC`,
      [application.id]
    );

    application.documents = docsRes.rows;

    return res.json(application);
  } catch (err) {
    logger.error({ msg: 'getMyApplicationByTender error', error: err.message });
    return next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/bid-applications/:applicationId/submit
// Finalize the bid application — creates an entry in the `bids` table.
// ---------------------------------------------------------------------------
exports.submitBidApplication = async (req, res, next) => {
  const { applicationId } = req.params;
  const supplierId = req.user.id;
  const { bid_amount, technical_proposal, completion_timeline_days } = req.body;

  if (!bid_amount || Number(bid_amount) <= 0) {
    return res.status(400).json({ error: 'bid_amount must be greater than 0' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the application row
    const appRes = await client.query(
      `SELECT ba.id, ba.tender_id, ba.status
       FROM bid_applications ba
       WHERE ba.id = $1 AND ba.supplier_id = $2
       FOR UPDATE`,
      [applicationId, supplierId]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Bid application not found' });
    }

    const application = appRes.rows[0];

    if (!['payment_confirmed', 'documents_uploaded'].includes(application.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot submit application with status '${application.status}'. Payment must be confirmed first.`,
      });
    }

    // Must have at least 1 document
    const docsRes = await client.query(
      `SELECT COUNT(*) AS doc_count FROM bid_application_documents
       WHERE application_id = $1`,
      [applicationId]
    );

    if (parseInt(docsRes.rows[0].doc_count, 10) < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'At least one document must be uploaded before submitting' });
    }

    // Collect bid documents from bid_application_documents for the bids.bid_documents JSONB
    const bidDocsRes = await client.query(
      `SELECT document_type, file_name, file_url, uploaded_at
       FROM bid_application_documents
       WHERE application_id = $1`,
      [applicationId]
    );

    // Check for existing bid in bids table (prevent duplicates)
    const existingBid = await client.query(
      `SELECT id FROM bids WHERE tender_id = $1 AND supplier_id = $2`,
      [application.tender_id, supplierId]
    );

    if (existingBid.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already submitted a bid for this tender' });
    }

    // Insert into existing bids table
    const bidRes = await client.query(
      `INSERT INTO bids
         (tender_id, supplier_id, bid_amount, technical_proposal,
          completion_timeline_days, bid_documents, status, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW())
       RETURNING *`,
      [
        application.tender_id,
        supplierId,
        bid_amount,
        technical_proposal || null,
        completion_timeline_days || null,
        JSON.stringify(bidDocsRes.rows),
      ]
    );

    // Update bid_application status to 'submitted'
    await client.query(
      `UPDATE bid_applications SET status = 'submitted', updated_at = NOW()
       WHERE id = $1`,
      [applicationId]
    );

    await client.query('COMMIT');

    logger.info({
      msg: 'Bid application submitted',
      applicationId,
      bidId: bidRes.rows[0].id,
      tenderId: application.tender_id,
      supplierId,
    });

    return res.status(201).json(bidRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ msg: 'submitBidApplication error', error: err.message });
    return next(err);
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------------------
// GET /api/bid-applications/check?tender_id=UUID
// Returns existing application for authenticated user+tender, or null
// ---------------------------------------------------------------------------
exports.checkExistingApplication = async (req, res, next) => {
  const { tender_id } = req.query;
  const supplierId = req.user.id;

  if (!tender_id) {
    return res.status(400).json({ error: 'tender_id query parameter is required' });
  }

  try {
    const appRes = await pool.query(
      `SELECT ba.*,
              t.title            AS tender_title,
              t.reference_number AS tender_reference_number,
              t.closing_date     AS tender_closing_date
       FROM bid_applications ba
       JOIN tenders t ON t.id = ba.tender_id
       WHERE ba.tender_id = $1 AND ba.supplier_id = $2`,
      [tender_id, supplierId]
    );

    if (appRes.rows.length === 0) {
      return res.json(null);
    }

    const application = appRes.rows[0];

    const docsRes = await pool.query(
      `SELECT * FROM bid_application_documents
       WHERE application_id = $1
       ORDER BY uploaded_at ASC`,
      [application.id]
    );

    application.documents = docsRes.rows;

    return res.json(application);
  } catch (err) {
    logger.error({ msg: 'checkExistingApplication error', error: err.message });
    return next(err);
  }
};
