const express = require('express');
const router = express.Router();
const adminPortalController = require('../controllers/adminPortalController');
const authenticateAdmin = require('../middleware/authenticateAdmin');

router.use(authenticateAdmin);

router.get('/dashboard', adminPortalController.getDashboardStats);
router.get('/alerts', adminPortalController.getSystemAlerts);
router.get('/suppliers', adminPortalController.listSuppliers);
router.get('/suppliers/:userId', adminPortalController.getSupplierDetail);
router.post('/suppliers/:userId/review', adminPortalController.reviewOnboarding);
router.delete('/suppliers/:userId', adminPortalController.deleteSupplierAccount);
router.get('/bids', adminPortalController.listBids);
router.get('/bids/:bidId', adminPortalController.getBidDetail);
router.post('/bids/:bidId/review', adminPortalController.reviewBid);
router.get('/documents/:documentId', adminPortalController.getDocument);

module.exports = router;
