const { Router } = require("express");
const auth = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validate");
const rateLimit = require("../middleware/rateLimit");

const router = Router();

// Rate limiter shared across all auth mutation routes (5 req / 15 min per IP+route)
const authLimiter = rateLimit({ max: 5, windowMs: 15 * 60 * 1000 });

// Validation schemas
const signupSchema = {
  email: "email",
  password: "string:min6",
  full_name: "string:min2",
  user_type: "enum:supplier,government_entity",
};

const loginSchema = {
  email: "email",
  password: "string:min6",
};

router.post("/signup", authLimiter, validate(signupSchema), auth.signup);
router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);
router.get("/me", authenticate, auth.me);

module.exports = router;

