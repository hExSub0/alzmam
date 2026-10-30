require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const AppError = require("./utils/AppError");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((origin) => origin.trim());

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new AppError(403, "Origin is not allowed", "CORS_REJECTED"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  maxAge: 600,
}));
app.use(express.json({ limit: "20kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "20kb", parameterLimit: 50 }));
app.use(hpp());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use((_req, _res, next) => next(new AppError(404, "Route not found", "NOT_FOUND")));
app.use(errorHandler);

module.exports = app;
