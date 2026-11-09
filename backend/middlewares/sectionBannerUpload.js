const multer = require("multer");
const AppError = require("../utils/AppError");

const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: MAX_BANNER_SIZE_BYTES, fields: 2, fieldSize: 100 * 1024 },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new AppError(400, "Use a JPG, PNG, WebP, or AVIF banner image.", "INVALID_IMAGE_TYPE"));
      return;
    }
    callback(null, true);
  },
}).single("bannerImage");

const uploadSectionBanner = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      req.sectionBannerFile = req.file || null;
      next();
      return;
    }
    if (error instanceof multer.MulterError) {
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Section banner images must be 5 MB or smaller."
        : "Upload one section banner image at a time.";
      next(new AppError(400, message, error.code === "LIMIT_FILE_SIZE" ? "IMAGE_TOO_LARGE" : "INVALID_IMAGE_UPLOAD"));
      return;
    }
    next(error);
  });
};

const parseSectionPayload = (req, _res, next) => {
  if (typeof req.body.payload !== "string") {
    next();
    return;
  }
  try {
    req.body = JSON.parse(req.body.payload);
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      throw new Error("Expected an object payload.");
    }
    next();
  } catch {
    next(new AppError(400, "Section data is invalid.", "INVALID_SECTION_PAYLOAD"));
  }
};

module.exports = { uploadSectionBanner, parseSectionPayload };
