const fs = require("node:fs/promises");
const path = require("node:path");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const Section = require("../models/Section");

const UPLOADS_DIRECTORY = path.join(__dirname, "../uploads/products");
const PUBLIC_PRODUCT_FIELDS = "name price description images options section isActive createdAt updatedAt";

const createProductSlug = (name) => name
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "");

const formatProduct = (product) => {
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

const getUploadedImagePaths = (files = []) => files.map(
  (file) => `/uploads/products/${file.filename}`,
);

const removeProductImages = async (imagePaths = []) => {
  const fileRemovalTasks = imagePaths
    .filter((imagePath) => imagePath.startsWith("/uploads/products/"))
    .map((imagePath) => {
      const fileName = path.basename(imagePath);
      const filePath = path.join(UPLOADS_DIRECTORY, fileName);
      return fs.unlink(filePath).catch(() => {});
    });

  await Promise.all(fileRemovalTasks);
};

const validateUniqueOptions = (options) => {
  const optionLabels = options.map((option) => option.label.toLocaleLowerCase());
  const labelsAreUnique = new Set(optionLabels).size === optionLabels.length;

  if (!labelsAreUnique) {
    throw new AppError(400, "يجب أن يكون لكل قائمة منسدلة اسم مختلف.", "DUPLICATE_OPTION_LABEL");
  }

  for (const option of options) {
    const normalizedValues = option.values.map((value) => value.toLocaleLowerCase());
    const valuesAreUnique = new Set(normalizedValues).size === normalizedValues.length;

    if (!valuesAreUnique) {
      throw new AppError(400, "لا يمكن تكرار القيم داخل القائمة المنسدلة.", "DUPLICATE_OPTION_VALUE");
    }
  }
};

const listPublicProducts = async (_req, res) => {
  const productsQuery = Product.find({ isActive: true })
    .select(PUBLIC_PRODUCT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const products = await productsQuery;

  res.json({ products: products.map(formatProduct) });
};

const getPublicProduct = async (req, res) => {
  const productIdentifier = req.params.id;
  let product = null;

  if (/^[a-f\d]{24}$/i.test(productIdentifier)) {
    product = await Product.findOne({ _id: productIdentifier, isActive: true })
      .select(PUBLIC_PRODUCT_FIELDS)
      .lean();
  }

  if (!product) {
    const activeProducts = await Product.find({ isActive: true })
      .select(PUBLIC_PRODUCT_FIELDS)
      .lean();
    product = activeProducts.find(
      (activeProduct) => createProductSlug(activeProduct.name) === productIdentifier,
    );
  }

  if (!product) {
    throw new AppError(404, "لم يتم العثور على المنتج.", "PRODUCT_NOT_FOUND");
  }

  res.json({ product: formatProduct(product) });
};

const listAdminProducts = async (_req, res) => {
  const productsQuery = Product.find()
    .select(PUBLIC_PRODUCT_FIELDS)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const products = await productsQuery;

  res.json({ products: products.map(formatProduct) });
};

const createProduct = async (req, res) => {
  const productData = req.body;
  const uploadedImages = req.files || [];
  const imagePositions = req.productImagePositions || uploadedImages.map((_image, index) => index);

  if (uploadedImages.length === 0 || !imagePositions.includes(0)) {
    throw new AppError(400, "الصورة الأولى مطلوبة لإضافة المنتج.", "PRODUCT_IMAGE_REQUIRED");
  }

  validateUniqueOptions(productData.options);
  const section = await Section.findOne({ _id: productData.sectionId, isActive: true }).select("_id");
  if (!section) throw new AppError(400, "Choose an active section for this product.", "INVALID_PRODUCT_SECTION");

  const imagePaths = getUploadedImagePaths(uploadedImages);
  const product = await Product.create({
    name: productData.name,
    price: productData.price,
    description: productData.description,
    section: section._id,
    images: imagePaths,
    options: productData.options,
    isActive: productData.isActive,
  });

  res.status(201).json({ product: formatProduct(product) });
};

const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const productData = req.body;
  const uploadedImages = req.files || [];
  const imagePositions = req.productImagePositions || uploadedImages.map((_image, index) => index);
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(404, "لم يتم العثور على المنتج.", "PRODUCT_NOT_FOUND");
  }

  validateUniqueOptions(productData.options);
  const section = await Section.findOne({ _id: productData.sectionId, isActive: true }).select("_id");
  if (!section) throw new AppError(400, "Choose an active section for this product.", "INVALID_PRODUCT_SECTION");

  const replacedImages = [];
  const hasReplacementImages = uploadedImages.length > 0;

  product.name = productData.name;
  product.price = productData.price;
  product.description = productData.description;
  product.isActive = productData.isActive;
  product.section = section._id;
  product.options = productData.options;

  if (hasReplacementImages) {
    const updatedImages = [...product.images];
    const uploadedImagePaths = getUploadedImagePaths(uploadedImages);

    uploadedImagePaths.forEach((imagePath, uploadedImageIndex) => {
      const imagePosition = imagePositions[uploadedImageIndex];

      if (imagePosition < updatedImages.length) {
        replacedImages.push(updatedImages[imagePosition]);
        updatedImages[imagePosition] = imagePath;
        return;
      }

      updatedImages.push(imagePath);
    });

    product.images = updatedImages;
  }

  await product.save();

  if (hasReplacementImages) {
    await removeProductImages(replacedImages);
  }

  res.json({ product: formatProduct(product) });
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new AppError(404, "لم يتم العثور على المنتج.", "PRODUCT_NOT_FOUND");
  }

  await removeProductImages(product.images);
  res.status(204).end();
};

module.exports = {
  listPublicProducts,
  getPublicProduct,
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
