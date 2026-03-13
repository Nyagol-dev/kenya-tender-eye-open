const { Router } = require("express");
const profiles = require("../controllers/profileController");
const authenticate = require("../middleware/authenticate");

const router = Router();

router.get("/:id", authenticate, profiles.getProfile);

module.exports = router;
