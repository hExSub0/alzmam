const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const ATTACHMENT_DIRECTORY = path.join(__dirname, "../uploads/order-attachments");
const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["application/pdf", ".pdf"],
]);

fs.mkdirSync(ATTACHMENT_DIRECTORY, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(_req, _file, callback) {
      callback(null, ATTACHMENT_DIRECTORY);
    },
    filename(_req, file, callback) {
      callback(null, `${crypto.randomUUID()}${ALLOWED_ATTACHMENT_TYPES.get(file.mimetype)}`);
    },
  }),
  limits: { files: MAX_ATTACHMENT_COUNT, fileSize: MAX_ATTACHMENT_SIZE_BYTES },
  fileFilter(_req, file, callback) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) {
      callback(new AppError(400, "يمكن رفع صور أو ملفات PDF فقط.", "INVALID_ORDER_ATTACHMENT_TYPE"));
      return;
    }
    callback(null, true);
  },
}).array("files", MAX_ATTACHMENT_COUNT);

const uploadOrderAttachments = (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const isTooLarge = error.code === "LIMIT_FILE_SIZE";
      const isTooMany = error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE";
      next(new AppError(400, isTooLarge
        ? "يجب ألا يتجاوز حجم الملف الواحد 5 ميجابايت."
        : isTooMany ? "يمكن إرفاق 5 ملفات كحد أقصى لكل منتج." : "تعذر رفع المرفقات. حاول مرة أخرى.",
      isTooLarge ? "ORDER_ATTACHMENT_TOO_LARGE" : isTooMany ? "TOO_MANY_ORDER_ATTACHMENTS" : "ORDER_ATTACHMENT_UPLOAD_FAILED"));
      return;
    }
    next(error);
  });
};

module.exports = uploadOrderAttachments;
