const express = require("express");
const router = express.Router();
const tenderController = require("../controllers/tenderController");
const authenticate = require("../middleware/authenticate");

router.get("/", tenderController.list);
router.post("/", authenticate, tenderController.create);
router.get("/:id", tenderController.getById);
router.post("/:id/bids", authenticate, tenderController.submitBid);

module.exports = router;
