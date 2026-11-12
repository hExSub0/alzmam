const StoreSettings = require("../models/StoreSettings");
const AppError = require("../utils/AppError");

const DEFAULT_BANNERS = [
  { src: "/images/banner-1.webp", alt: "دروع وهدايا زمام الجودة" },
  { src: "/images/banner-2.webp", alt: "هدايا دعائية من زمام الجودة" },
  { src: "/images/banner-3.webp", alt: "منتجات زمام الجودة" },
];

const getBanners = async (_req, res) => {
  let settings = await StoreSettings.findOne({ key: "store" }).lean();
  if (!settings) settings = await StoreSettings.create({ key: "store", banners: DEFAULT_BANNERS });
  res.set("Cache-Control", "no-store").json({ banners: settings.banners });
};

const updateBanners = async (req, res) => {
  const banners = req.body.banners.map((banner) => ({
    src: banner.src.trim(), alt: banner.alt.trim(),
  }));
  if (banners.some(({ src }) => !(src.startsWith("/") && !src.startsWith("//")) && !/^https:\/\//i.test(src))) {
    throw new AppError(400, "Banner image URLs must be local paths or HTTPS URLs.", "INVALID_BANNER_URL");
  }
  const settings = await StoreSettings.findOneAndUpdate(
    { key: "store" }, { $set: { banners } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();
  res.json({ banners: settings.banners });
};

module.exports = { getBanners, updateBanners };
