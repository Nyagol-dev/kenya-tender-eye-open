const express = require("express");
const router = express.Router();
const tenderController = require("../controllers/tenderController");
const authenticate = require("../middleware/authenticate");

router.get("/", tenderController.list);
router.get("/:id", tenderController.getById);
router.post("/:id/bids", authenticate, tenderController.submitBid);

module.exports = router;
