const pool = require('../db/pool');
const logger = require('../lib/logger');

exports.initOnboarding = async (client, userId) => {
  const result = await client.query(
    `INSERT INTO supplier_onboarding (user_id, status, deadline, step_completed)
     VALUES ($1, 'pending', NOW() + INTERVAL '48 hours', 0)
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
};

exports.getMyOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT * FROM supplier_onboarding WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    const onboarding = result.rows[0];

    const docsResult = await pool.query(
      `SELECT * FROM onboarding_documents WHERE onboarding_id = $1`,
      [onboarding.id]
    );

    onboarding.documents = docsResult.rows;

    res.json(onboarding);
  } catch (err) {
    logger.error('getMyOnboarding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStep = async (req, res) => {
  const client = await pool.connect();
  try {
    const stepNumber = parseInt(req.params.stepNumber, 10);
    const userId = req.user.id;

    await client.query('BEGIN');

    const result = await client.query(
      `SELECT * FROM supplier_onboarding WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    const onboarding = result.rows[0];

    if (['approved', 'rejected', 'expired'].includes(onboarding.status)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: `Cannot update onboarding in ${onboarding.status} status` });
    }

    if (new Date(onboarding.deadline) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Onboarding deadline has passed' });
    }

    if (onboarding.status === 'pending') {
      await client.query(
        `UPDATE supplier_onboarding SET status = 'in_progress' WHERE id = $1`,
        [onboarding.id]
      );
      onboarding.status = 'in_progress';
    }

    let nextStepCompleted = Math.max(onboarding.step_completed, stepNumber);

    if (stepNumber === 1) {
      const { business_name, business_type, registration_number, kra_pin, years_in_operation, number_of_employees } = req.body;
      if (!business_name || !business_type || !registration_number || !kra_pin || years_in_operation === undefined || number_of_employees === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'All fields are required for step 1' });
      }
      if (years_in_operation < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Years in operation must be >= 0' });
      }
      if (number_of_employees < 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Number of employees must be >= 1' });
      }

      await client.query(
        `UPDATE supplier_onboarding 
         SET business_name = $1, business_type = $2, registration_number = $3, kra_pin = $4, years_in_operation = $5, number_of_employees = $6, step_completed = $7, updated_at = NOW()
         WHERE id = $8`,
        [business_name, business_type, registration_number, kra_pin, years_in_operation, number_of_employees, nextStepCompleted, onboarding.id]
      );
    } else if (stepNumber === 2) {
      const { primary_service_category_id, secondary_categories, counties_of_operation, max_contract_value } = req.body;
      if (!primary_service_category_id || max_contract_value === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Primary category and max contract value are required' });
      }
      if (max_contract_value <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Max contract value must be > 0' });
      }

      await client.query(
        `UPDATE supplier_onboarding 
         SET primary_service_category_id = $1, secondary_categories = $2, counties_of_operation = $3, max_contract_value = $4, step_completed = $5, updated_at = NOW()
         WHERE id = $6`,
        [primary_service_category_id, secondary_categories || [], counties_of_operation || [], max_contract_value, nextStepCompleted, onboarding.id]
      );
    } else if (stepNumber === 3) {
      const { projects } = req.body;
      if (!projects || !Array.isArray(projects) || projects.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'At least 1 project is required' });
      }
      for (const p of projects) {
        if (!p.title || !p.client || !p.value || !p.year || !p.duration_months || !p.description) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'All fields are required per project' });
        }
      }

      await client.query(
        `UPDATE supplier_onboarding 
         SET previous_projects = $1, step_completed = $2, updated_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(projects), nextStepCompleted, onboarding.id]
      );
    } else if (stepNumber === 4) {
      if (onboarding.step_completed < 3 && nextStepCompleted < 3) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Must complete steps 1-3 first' });
      }

      const docsResult = await client.query(
        `SELECT document_type FROM onboarding_documents WHERE onboarding_id = $1`,
        [onboarding.id]
      );
      const docs = docsResult.rows.map(r => r.document_type);
      const requiredDocs = ['certificate_of_incorporation', 'kra_tax_compliance', 'director_id'];
      
      const missingDocs = requiredDocs.filter(d => !docs.includes(d));
      if (missingDocs.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Missing required documents: ${missingDocs.join(', ')}` });
      }

      await client.query(
        `UPDATE supplier_onboarding 
         SET status = 'submitted', submitted_at = NOW(), step_completed = $1, updated_at = NOW()
         WHERE id = $2`,
        [Math.max(onboarding.step_completed, 4), onboarding.id]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid step number' });
    }

    const updatedRes = await client.query(
      `SELECT * FROM supplier_onboarding WHERE id = $1`,
      [onboarding.id]
    );

    await client.query('COMMIT');
    res.json(updatedRes.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('updateStep error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

exports.uploadDocument = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { document_type, file_name, file_url, file_size_bytes, mime_type } = req.body;

    if (!document_type || !file_name || !file_url || file_size_bytes === undefined || !mime_type) {
      return res.status(400).json({ error: 'Missing document fields' });
    }

    await client.query('BEGIN');

    const onboardingRes = await client.query(
      `SELECT id, status FROM supplier_onboarding WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (onboardingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    const onboarding = onboardingRes.rows[0];

    if (['submitted', 'approved', 'rejected', 'expired'].includes(onboarding.status)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: `Cannot upload documents in ${onboarding.status} status` });
    }

    await client.query(
      `DELETE FROM onboarding_documents WHERE onboarding_id = $1 AND document_type = $2`,
      [onboarding.id, document_type]
    );

    const result = await client.query(
      `INSERT INTO onboarding_documents (onboarding_id, document_type, file_name, file_url, file_size_bytes, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [onboarding.id, document_type, file_name, file_url, file_size_bytes, mime_type]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('uploadDocument error:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.documentId;

    const onboardingRes = await pool.query(
      `SELECT id, status FROM supplier_onboarding WHERE user_id = $1`,
      [userId]
    );

    if (onboardingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    const onboarding = onboardingRes.rows[0];

    if (['submitted', 'approved', 'rejected', 'expired'].includes(onboarding.status)) {
      return res.status(403).json({ error: `Cannot delete documents in ${onboarding.status} status` });
    }

    const docRes = await pool.query(
      `DELETE FROM onboarding_documents WHERE id = $1 AND onboarding_id = $2 RETURNING id`,
      [documentId, onboarding.id]
    );

    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found or does not belong to user' });
    }

    res.status(204).end();

  } catch (err) {
    logger.error('deleteDocument error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
