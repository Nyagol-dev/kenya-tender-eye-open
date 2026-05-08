const express = require("express");
const router = express.Router();
const tenderController = require("../controllers/tenderController");

router.get("/", tenderController.list);
router.get("/:id", tenderController.getById);

module.exports = router;
