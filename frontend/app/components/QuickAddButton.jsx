"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { getQuickAddSelection } from "../lib/productApi";

export default function QuickAddButton({ product, addItem, className = "" }) {
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const handleAdd = () => {
    const selection = getQuickAddSelection(product);
    addItem(product, 1, selection.options, selection.price);
    setAdded(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-live="polite"
      className={`${className} flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition-colors ${added ? "bg-green-600 hover:bg-green-600" : "bg-[#1D1F1F] hover:bg-[#343838]"}`}
    >
      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
      {added ? "تمت الإضافة إلى السلة" : "أضف إلى السلة"}
    </button>
  );
}
