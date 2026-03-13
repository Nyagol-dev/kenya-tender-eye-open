const { Router } = require("express");
const auth = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");

const router = Router();

router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/me", authenticate, auth.me);

module.exports = router;
