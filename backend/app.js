require("dotenv").config();
const express = require("express");
const path = require("node:path");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const storeController = require("./controllers/storeController");
const AppError = require("./utils/AppError");
const errorHandler = require("./middlewares/errorHandler");

const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
const REQUEST_BODY_LIMIT = "20kb";
const URL_ENCODED_PARAMETER_LIMIT = 50;

const app = express();
const configuredFrontendOrigins = process.env.FRONTEND_URL || DEFAULT_FRONTEND_ORIGIN;
const allowedOrigins = configuredFrontendOrigins
  .split(",")
  .map((origin) => origin.trim());
const trustedProxyHops = Number(process.env.TRUST_PROXY || 0);

app.disable("x-powered-by");
app.set("trust proxy", trustedProxyHops);

app.use(helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
}));
app.use(cors({
  origin(origin, callback) {
    const requestHasNoOrigin = !origin;
    const originIsAllowed = allowedOrigins.includes(origin);

    if (requestHasNoOrigin || originIsAllowed) {
      return callback(null, true);
    }

    return callback(new AppError(403, "مصدر الطلب غير مسموح به.", "CORS_REJECTED"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  maxAge: 600,
}));

app.use(express.json({
  limit: REQUEST_BODY_LIMIT,
  strict: true,
}));
app.use(express.urlencoded({
  extended: false,
  limit: REQUEST_BODY_LIMIT,
  parameterLimit: URL_ENCODED_PARAMETER_LIMIT,
}));
app.use(hpp());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/banners", storeController.getBanners);
app.use("/uploads/products", express.static(path.join(__dirname, "uploads/products")));
app.use("/uploads/sections", express.static(path.join(__dirname, "uploads/sections")));
app.use("/uploads/order-attachments", express.static(path.join(__dirname, "uploads/order-attachments")));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use((_req, _res, next) => {
  next(new AppError(404, "لم يتم العثور على الصفحة المطلوبة.", "NOT_FOUND"));
});
app.use(errorHandler);

module.exports = app;
