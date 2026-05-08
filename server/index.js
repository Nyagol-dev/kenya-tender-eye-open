require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const serviceCategoryRoutes = require("./routes/serviceCategories");

const app = express();
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

// --------------- Health check ---------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
