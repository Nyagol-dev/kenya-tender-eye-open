const express = require('express');
const router = express.Router();
const bidAppController = require('../controllers/bidApplicationController');
const authenticate = require('../middleware/authenticate');

// M-Pesa callback — NO auth (called by Daraja servers)
router.post('/mpesa-callback', bidAppController.mpesaCallback);

// All remaining routes require authentication
router.use(authenticate);

router.post('/', bidAppController.initiateBidApplication);
router.get('/check', authenticate, bidAppController.checkExistingApplication);
router.get('/tender/:tenderId', bidAppController.getMyApplicationByTender);
router.get('/:applicationId', bidAppController.getMyApplication);
router.post('/:applicationId/documents', bidAppController.uploadBidDocument);
router.post('/:applicationId/submit', bidAppController.submitBidApplication);

module.exports = router;
