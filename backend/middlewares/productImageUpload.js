const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const PRODUCT_IMAGE_DIRECTORY = path.join(__dirname, "../uploads/products");
const MAX_PRODUCT_IMAGES = 5;
const MAX_PRODUCT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);

fs.mkdirSync(PRODUCT_IMAGE_DIRECTORY, { recursive: true });

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, PRODUCT_IMAGE_DIRECTORY);
  },
  filename(_req, file, callback) {
    const imageExtension = ALLOWED_IMAGE_TYPES.get(file.mimetype);
    callback(null, `${crypto.randomUUID()}${imageExtension}`);
  },
});

const multerUpload = multer({
  storage,
  limits: {
    files: MAX_PRODUCT_IMAGES,
    fileSize: MAX_PRODUCT_IMAGE_SIZE_BYTES,
    fields: 10,
    fieldSize: 100 * 1024,
  },
  fileFilter(_req, file, callback) {
    const isAllowedImageType = ALLOWED_IMAGE_TYPES.has(file.mimetype);

    if (!isAllowedImageType) {
      callback(new AppError(
        400,
        "نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP أو AVIF.",
        "INVALID_IMAGE_TYPE",
      ));
      return;
    }

    callback(null, true);
  },
}).array("images", MAX_PRODUCT_IMAGES);

const uploadProductImages = (req, res, next) => {
  multerUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(new AppError(400, "يجب ألا يتجاوز حجم الصورة الواحدة 5 ميجابايت.", "IMAGE_TOO_LARGE"));
        return;
      }

      if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
        next(new AppError(400, "يمكن رفع 5 صور كحد أقصى لكل منتج.", "TOO_MANY_IMAGES"));
        return;
      }

      next(new AppError(400, "تعذر رفع الصور. تحقق من الملفات وحاول مرة أخرى.", "IMAGE_UPLOAD_FAILED"));
      return;
    }

    next(error);
  });
};

const parseProductOptions = (req, _res, next) => {
  const submittedOptions = req.body.options;

  if (submittedOptions === undefined || submittedOptions === "") {
    req.body.options = [];
    next();
    return;
  }

  if (typeof submittedOptions !== "string") {
    next();
    return;
  }

  try {
    req.body.options = JSON.parse(submittedOptions);
    next();
  } catch {
    next(new AppError(400, "بيانات خيارات المنتج غير صحيحة.", "INVALID_PRODUCT_OPTIONS"));
  }
};

const parseProductImagePositions = (req, _res, next) => {
  const uploadedImages = req.files || [];
  const submittedPositions = req.body.imagePositions;

  if (submittedPositions === undefined || submittedPositions === "") {
    req.productImagePositions = uploadedImages.map((_image, index) => index);
    next();
    return;
  }

  let imagePositions;
  try {
    imagePositions = JSON.parse(submittedPositions);
  } catch {
    next(new AppError(400, "ØªØ±ØªÙŠØ¨ Ø§Ù„ØµÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­.", "INVALID_IMAGE_POSITIONS"));
    return;
  }

  const positionsAreValid = Array.isArray(imagePositions)
    && imagePositions.length === uploadedImages.length
    && imagePositions.every((position) => Number.isInteger(position) && position >= 0 && position < MAX_PRODUCT_IMAGES)
    && new Set(imagePositions).size === imagePositions.length;

  if (!positionsAreValid) {
    next(new AppError(400, "Ù…ÙˆØ§Ù‚Ø¹ Ø§Ù„ØµÙˆØ± Ø§Ù„Ù…Ø±ÙÙˆØ¹Ø© ØºÙŠØ± ØµØ­ÙŠØ­Ø©.", "INVALID_IMAGE_POSITIONS"));
    return;
  }

  req.productImagePositions = imagePositions;
  delete req.body.imagePositions;
  next();
};

module.exports = {
  parseProductOptions,
  parseProductImagePositions,
  uploadProductImages,
};
