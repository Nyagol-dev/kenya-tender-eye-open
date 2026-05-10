const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/me', onboardingController.getMyOnboarding);
router.patch('/step/:stepNumber', onboardingController.updateStep);
router.post('/documents', onboardingController.uploadDocument);
router.delete('/documents/:documentId', onboardingController.deleteDocument);

module.exports = router;
