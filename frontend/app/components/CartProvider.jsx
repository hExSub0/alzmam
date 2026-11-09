'use client';

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "alzmam-cart";
const LEGACY_STORAGE_KEY = ["pal", "mera-cart"].join("");
const CartContext = createContext(null);

function parsePrice(price) {
  const digits = String(price).match(/[٠-٩0-9]+(?:[.,٫][٠-٩0-9]+)?/);
  if (!digits) return null;
  const normalized = digits[0]
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٫,]/g, ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
          window.localStorage.setItem(STORAGE_KEY, stored);
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {}
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const addItem = (product, quantity = 1, options = {}, selectedUnitPrice = null, details = {}) => {
    const normalizedOptions = Object.fromEntries(Object.entries(options).sort(([a], [b]) => a.localeCompare(b)));
    const note = String(details.note || "").trim();
    const attachments = Array.isArray(details.attachments) ? details.attachments : [];
    const key = `${product.id}:${JSON.stringify(normalizedOptions)}:${note}:${attachments.map((attachment) => attachment.url).join(",")}`;
    const basePrice = parsePrice(product.price);
    const unitPrice = selectedUnitPrice !== null
      ? Number(selectedUnitPrice)
      : basePrice;

    setItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key
          ? {
            ...item,
            price: unitPrice === null ? item.price : formatCurrency(unitPrice),
            unitPrice,
            quantity: item.quantity + quantity,
          }
          : item);
      }
      return [...current, {
        key,
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: unitPrice === null ? product.price : formatCurrency(unitPrice),
        unitPrice,
        quantity,
        options: normalizedOptions,
        note,
        attachments,
      }];
    });
  };

  const setItemQuantity = (key, quantity) => {
    setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const removeItem = (key) => setItems((current) => current.filter((item) => item.key !== key));
  const clearCart = () => setItems([]);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0);
  const hasUnpricedItems = items.some((item) => item.unitPrice === null);

  const value = useMemo(() => ({
    items,
    itemCount,
    total,
    hasUnpricedItems,
    ready,
    addItem,
    setItemQuantity,
    removeItem,
    clearCart,
  }), [items, itemCount, total, hasUnpricedItems, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export function formatCurrency(amount) {
  return `${new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(amount)} ر.س`;
}
