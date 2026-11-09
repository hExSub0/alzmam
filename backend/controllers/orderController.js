const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const { publishNewOrder } = require("../realtime/orderNotifications");

const createProductSlug = (name) => String(name || "")
  .normalize("NFKC")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "");

const addProductSnapshots = async (orders) => {
  const missingProductIds = [...new Set(orders.flatMap((order) => order.items)
    .filter((item) => !item.image && item.product)
    .map((item) => String(item.product)))];
  const products = missingProductIds.length
    ? await Product.find({ _id: { $in: missingProductIds } }).select("images").lean()
    : [];
  const imagesByProductId = new Map(products.map((product) => [String(product._id), product.images?.[0] || ""]));

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      image: item.image || imagesByProductId.get(String(item.product)) || "",
      slug: item.slug || createProductSlug(item.name) || String(item.product),
    })),
  }));
};

const createOrder = async (req, res) => {
  const { customer, items, paymentMethod = "cash_on_delivery" } = req.body;
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true })
    .select("name price options images")
    .lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  if (productsById.size !== productIds.length) {
    throw new AppError(400, "أحد المنتجات لم يعد متاحاً. حدّث سلتك وحاول مجدداً.", "PRODUCT_UNAVAILABLE");
  }

  const orderItems = items.map((item) => {
    const product = productsById.get(item.productId);
    const availableOptions = new Map((product.options || []).map((option) => [option.label, option]));
    const selections = Object.entries(item.options || {});

    if (selections.length !== availableOptions.size || selections.some(([label, value]) => {
      const option = availableOptions.get(label);
      return !option || !option.values.includes(value);
    })) {
      throw new AppError(400, `يرجى مراجعة خيارات المنتج: ${product.name}.`, "INVALID_PRODUCT_OPTIONS");
    }

    let fixedPrice = null;
    const optionSurcharge = selections.reduce((sum, [label, value]) => {
      const option = availableOptions.get(label);
      const valueIndex = option.values.indexOf(value);
      const selectedPrice = Number(option.valuePrices?.[valueIndex] || 0);
      const pricingMode = option.valuePricingModes?.[valueIndex] || option.pricingMode || (option.valuePrices?.length ? "additive" : "none");
      if (pricingMode === "fixed") {
        fixedPrice = selectedPrice;
        return sum;
      }
      return sum + (pricingMode === "additive" ? selectedPrice : 0);
    }, 0);

    return {
      product: product._id,
      name: product.name,
      image: product.images?.[0] || "",
      slug: createProductSlug(product.name),
      unitPrice: (fixedPrice ?? product.price) + optionSurcharge,
      quantity: item.quantity,
      options: item.options || {},
      note: item.note || "",
      attachments: item.attachments || [],
    };
  });
  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const order = await Order.create({
    user: req.user._id,
    customer,
    items: orderItems,
    total,
    paymentMethod,
  });
  publishNewOrder(order);

  res.status(201).json({ order });
};

const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ orders: await addProductSnapshots(orders) });
};

const cancelMyOrder = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: { $in: ["pending", "confirmed"] } },
    { $set: { status: "cancelled" } },
    { new: true, runValidators: true },
  );

  if (order) {
    return res.json({ order });
  }

  const existingOrder = await Order.findOne({ _id: req.params.id, user: req.user._id }).select("status").lean();
  if (!existingOrder) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");
  if (existingOrder.status === "cancelled") {
    const cancelledOrder = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean();
    return res.json({ order: cancelledOrder });
  }

  throw new AppError(409, "This order can no longer be cancelled because it has started shipping.", "ORDER_CANNOT_BE_CANCELLED");
};

const listAllOrders = async (_req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  res.json({ orders: await addProductSnapshots(orders) });
};

const updateOrderStatus = async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: { status: req.body.status } },
    { new: true, runValidators: true },
  ).populate("user", "name email");
  if (!order) throw new AppError(404, "Order not found.", "ORDER_NOT_FOUND");
  res.json({ order });
};

const saveOrderAttachments = async (req, res) => {
  const attachments = (req.files || []).map((file) => ({
    name: file.originalname.replace(/[\\/]/g, "_").slice(0, 255) || "مرفق الطلب",
    url: `/uploads/order-attachments/${file.filename}`,
    contentType: file.mimetype,
    size: file.size,
  }));
  res.status(201).json({ attachments });
};

module.exports = { createOrder, listMyOrders, cancelMyOrder, listAllOrders, updateOrderStatus, saveOrderAttachments };
