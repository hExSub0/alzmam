export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
).replace(/\/+$/, "");

const API_ORIGIN = new URL(API_BASE_URL).origin;

export function getProductImageUrl(imagePath) {
  if (!imagePath) return "";

  return new URL(imagePath, API_ORIGIN).toString();
}

export function createProductSlug(name) {
  return String(name || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeProduct(product) {
  const sourceImages = product.images?.length
    ? product.images
    : product.gallery?.length
      ? product.gallery
      : [product.image].filter(Boolean);
  const images = sourceImages.map(getProductImageUrl);

  return {
    ...product,
    id: product.id || product._id,
    slug: product.slug || createProductSlug(product.name) || product.id || product._id,
    images,
    image: images[0] || "",
    gallery: images,
    options: (product.options || []).map((option) => ({
      ...option,
      values: option.values || [],
      pricingMode: option.pricingMode || (option.valuePrices?.length ? "additive" : "none"),
      valuePrices: (option.values || []).map((_value, index) => Number(option.valuePrices?.[index] ?? 0)),
      valuePricingModes: (option.values || []).map((_value, index) => option.valuePricingModes?.[index] || option.pricingMode || (option.valuePrices?.length ? "additive" : "none")),
    })),
  };
}

export function getProductPrice(product, selectedOptions = {}) {
  const options = product.options || [];
  const fixedSelection = options.flatMap((option) => {
    const selectedIndex = option.values.indexOf(selectedOptions[option.label]);
    return selectedIndex >= 0 && (option.valuePricingModes?.[selectedIndex] || option.pricingMode) === "fixed"
      ? [Number(option.valuePrices?.[selectedIndex] || 0)]
      : [];
  })[0];
  let price = fixedSelection ?? (Number(product.price) || 0);

  for (const option of options) {
    const selectedIndex = option.values.indexOf(selectedOptions[option.label]);
    if (selectedIndex < 0) continue;
    const mode = option.valuePricingModes?.[selectedIndex] || option.pricingMode || "none";
    const valuePrice = Number(option.valuePrices?.[selectedIndex] || 0);
    if (mode === "additive") price += valuePrice;
  }

  return price;
}

export function getProductStartingPrice(product) {
  return Number(product.price) || 0;
}

export function getQuickAddSelection(product) {
  const selectedOptions = Object.fromEntries((product.options || [])
    .filter((option) => option.label)
    .map((option) => [option.label, option.values?.[0] || ""]));

  return {
    options: selectedOptions,
    price: getProductPrice(product, selectedOptions),
  };
}
