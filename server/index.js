require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const serviceCategoryRoutes = require("./routes/serviceCategories");
const tenderRoutes = require("./routes/tenders");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const logger = require('./lib/logger');
// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({ method: req.method, url: req.originalUrl, status: res.statusCode, duration }, 'HTTP request');
  });
  next();
});
const PORT = process.env.PORT || 5000;

// --------------- Middleware ---------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:8080",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// --------------- Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/service-categories", serviceCategoryRoutes);
app.use("/api/tenders", tenderRoutes);

// --------------- Health check ---------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Centralized error handler (MUST be last) ---------------
app.use(errorHandler);

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
