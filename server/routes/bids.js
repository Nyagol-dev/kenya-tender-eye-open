const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.post('/', bidController.submitBid);
router.get('/my', bidController.getMyBids);
router.get('/:bidId', bidController.getBidById);
router.delete('/:bidId', bidController.withdrawBid);

module.exports = router;
