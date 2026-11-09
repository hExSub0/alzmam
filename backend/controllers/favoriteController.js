const Product = require("../models/Product");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const FAVORITE_PRODUCT_FIELDS = "name price description images options isActive createdAt updatedAt";

const createProductSlug = (name) => name
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "");

const formatFavoriteProduct = (product) => {
  const productData = typeof product.toObject === "function"
    ? product.toObject()
    : product;
  const productId = String(productData._id || productData.id);
  const images = productData.images || [];

  return {
    ...productData,
    id: productId,
    slug: createProductSlug(productData.name) || productId,
    image: images[0] || "",
    gallery: images,
  };
};

const getFavoriteProducts = async (userId) => {
  const user = await User.findById(userId)
    .select("+favorites")
    .populate({
      path: "favorites",
      match: { isActive: true },
      select: FAVORITE_PRODUCT_FIELDS,
    });

  if (!user) {
    throw new AppError(404, "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….", "USER_NOT_FOUND");
  }

  return user.favorites
    .filter(Boolean)
    .map(formatFavoriteProduct);
};

const listFavorites = async (req, res) => {
  const favorites = await getFavoriteProducts(req.user._id);
  res.json({ favorites });
};

const addFavorite = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.id;
  const product = await Product.findOne({ _id: productId, isActive: true }).select("_id");

  if (!product) {
    throw new AppError(404, "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØªØ¬.", "PRODUCT_NOT_FOUND");
  }

  await User.updateOne(
    { _id: userId },
    { $addToSet: { favorites: product._id } },
  );

  const favorites = await getFavoriteProducts(userId);
  res.json({ favorites });
};

const removeFavorite = async (req, res) => {
  const userId = req.user._id;
  const productId = req.params.id;

  await User.updateOne(
    { _id: userId },
    { $pull: { favorites: productId } },
  );

  const favorites = await getFavoriteProducts(userId);
  res.json({ favorites });
};

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
};
