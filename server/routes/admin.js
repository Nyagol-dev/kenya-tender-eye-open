const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const isAdmin = require('../middleware/isAdmin');

router.patch('/suppliers/:id/approve', authenticate, isAdmin, adminController.approveSupplier);

module.exports = router;
