const Section = require("../models/Section");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const slugify = (value) => value.normalize("NFKC").toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");

const listPublicSections = async (_req, res) => {
  const sections = await Section.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  res.set("Cache-Control", "no-store").json({ sections });
};

const listAdminSections = async (_req, res) => {
  const sections = await Section.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  res.json({ sections });
};

const isSafeUrl = (url) => !url || (url.startsWith("/") && !url.startsWith("//")) || /^https:\/\//i.test(url);
const validateBanner = (banner = {}) => isSafeUrl(banner.src) && isSafeUrl(banner.link);

const saveBannerImage = async (file) => {
  if (!file) return null;
  const extensionByMime = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/avif": ".avif" };
  const extension = extensionByMime[file.mimetype];
  if (!extension) throw new AppError(400, "Unsupported section banner image type.", "INVALID_IMAGE_TYPE");
  const directory = path.join(__dirname, "../uploads/sections");
  await fs.mkdir(directory, { recursive: true });
  const fileName = `${crypto.randomUUID()}${extension}`;
  await fs.writeFile(path.join(directory, fileName), file.buffer, { flag: "wx" });
  return `/uploads/sections/${fileName}`;
};

const createSection = async (req, res) => {
  const { name, banner = {}, sortOrder = 0 } = req.body;
  if (!validateBanner(banner)) throw new AppError(400, "Banner image and link must use a local path or HTTPS URL.", "INVALID_SECTION_BANNER");
  const slug = slugify(name);
  if (!slug) throw new AppError(400, "Section name must contain letters or numbers.", "INVALID_SECTION_NAME");
  if (await Section.exists({ slug })) throw new AppError(409, "A section with this name already exists.", "SECTION_EXISTS");
  const bannerSrc = await saveBannerImage(req.sectionBannerFile) || banner.src;
  const section = await Section.create({ name, slug, banner: { ...banner, src: bannerSrc }, sortOrder });
  res.status(201).json({ section });
};

const updateSection = async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) throw new AppError(404, "Section not found.", "SECTION_NOT_FOUND");
  const { name, banner = {}, sortOrder = 0, isActive = true } = req.body;
  if (!validateBanner(banner)) throw new AppError(400, "Banner image and link must use a local path or HTTPS URL.", "INVALID_SECTION_BANNER");
  const slug = slugify(name);
  if (!slug) throw new AppError(400, "Section name must contain letters or numbers.", "INVALID_SECTION_NAME");
  if (await Section.exists({ slug, _id: { $ne: section._id } })) throw new AppError(409, "A section with this name already exists.", "SECTION_EXISTS");
  const bannerSrc = await saveBannerImage(req.sectionBannerFile) || banner.src;
  Object.assign(section, { name, slug, banner: { ...banner, src: bannerSrc }, sortOrder, isActive });
  await section.save();
  res.json({ section });
};

const deleteSection = async (req, res) => {
  const section = await Section.findByIdAndDelete(req.params.id);
  if (!section) throw new AppError(404, "Section not found.", "SECTION_NOT_FOUND");
  await Product.updateMany({ section: section._id }, { $unset: { section: 1 } });
  res.status(204).end();
};

module.exports = { listPublicSections, listAdminSections, createSection, updateSection, deleteSection };
