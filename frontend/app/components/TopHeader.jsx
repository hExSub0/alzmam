"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpLeft, Search, X } from "lucide-react";
import { API_BASE_URL, normalizeProduct } from "../lib/productApi";

const searchChips = ["دروع كريستال", "مجسمات", "هدايا تذكارية", "دروع فاخرة"];

function normalizeSearch(value) {
  return value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLocaleLowerCase("ar");
}

export default function TopHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const searchInputRef = useRef(null);
  const router = useRouter();
  const normalizedQuery = normalizeSearch(searchQuery.trim());
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/products`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setProducts((payload.products || []).map(normalizeProduct)))
      .catch((error) => {
        if (error.name !== "AbortError") setProducts([]);
      });
    return () => controller.abort();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products.slice(0, 5);
    if (["دروع كريستال", "مجسمات", "هدايا تذكارية", "دروع فاخرة"].includes(searchQuery.trim())) {
      const categoryWords = {
        "دروع كريستال": ["درع", "كريستال"],
        "مجسمات": ["مجسم"],
        "هدايا تذكارية": ["مجسم", "درع"],
        "دروع فاخرة": ["درع", "فاخر"],
      }[searchQuery.trim()];
      return products.filter((product) => categoryWords.some((word) => normalizeSearch(product.name).includes(normalizeSearch(word))));
    }
    return products.filter((product) => normalizeSearch(`${product.name} ${product.description}`).includes(normalizedQuery));
  }, [normalizedQuery, searchQuery, products]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSearchOpen(false);
      if (event.key === "Enter" && filteredProducts[0]) {
        setIsSearchOpen(false);
        router.push(`/products/${filteredProducts[0].slug}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, filteredProducts, router]);

  const closeSearch = () => setIsSearchOpen(false);

  return (
    <>
      <div className="min-h-12 w-full bg-[#1D1F1F] text-gray-300">
        <div className="mx-auto flex min-h-12 w-full max-w-7xl flex-col items-stretch justify-center gap-2 px-3 py-2 sm:px-4 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0">
          <nav aria-label="روابط الموقع" className="order-2 flex w-full items-center justify-center gap-4 overflow-x-auto border-t border-white/10 pt-2 text-[11px] whitespace-nowrap md:order-1 md:w-auto md:shrink-0 md:justify-start md:gap-4 md:overflow-visible md:border-0 md:pt-0 md:text-sm">
            <Link href="/about" className="text-gray-200 transition-colors hover:text-white">{"\u0645\u0646 \u0646\u062d\u0646"}</Link>
            <span aria-hidden="true" className="h-4 w-px bg-white/15" />
            <a href="#" className="text-gray-200 transition-colors hover:text-white">سياسة الخصوصية</a>
            <span aria-hidden="true" className="h-4 w-px bg-white/15" />
            <a href="#" className="text-gray-200 transition-colors hover:text-white">الشروط والأحكام</a>
          </nav>

          <button type="button" onClick={() => setIsSearchOpen(true)} className="order-1 min-w-0 w-[82%] max-w-2xl self-center text-right md:order-2 md:flex-1 md:w-auto md:max-w-[760px]">
            <span className="relative flex items-center">
              <Search size={14} className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
              <span dir="rtl" className="flex h-9 w-full items-center rounded-full bg-[#303232] pr-[35px] pl-3 text-xs text-gray-400 transition-colors hover:bg-[#3a3c3c]">{searchQuery || "ابحث"}</span>
            </span>
          </button>

        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[100] bg-slate-950/45"
            onMouseDown={closeSearch}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="البحث في المنتجات"
              onMouseDown={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: -10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed left-1/2 top-[54px] max-h-[calc(100vh-66px)] w-[min(90vw,1100px)] -translate-x-1/2 overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-5"
              dir="rtl"
            >
            <div className="relative flex items-center">
              <Search size={17} className="pointer-events-none absolute right-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحث"
                className="h-11 w-full rounded-full border border-gray-200 bg-gray-100 px-10 text-sm text-gray-800 outline-none transition focus:border-gray-300 focus:bg-white"
              />
              <button type="button" onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-900">
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-400">التصنيفات الأكثر بحثًا</h2>
              <div className="flex flex-wrap gap-2">
                {searchChips.map((chip) => (
                  <button key={chip} type="button" onClick={() => setSearchQuery(chip)} className="cursor-pointer rounded-full bg-gray-100 px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900">
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-gray-400">{normalizedQuery ? "نتائج البحث" : "الأكثر بحثًا"}</h2>
              {filteredProducts.length ? (
                <ul className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <li key={product.id}>
                      <Link href={`/products/${product.slug}`} onClick={closeSearch} className="flex items-center gap-3 py-2.5 text-sm text-gray-600 transition-colors hover:text-gray-950">
                        <Search size={15} className="shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1 truncate">{product.name}</span>
                        <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">{new Intl.NumberFormat("ar-SA").format(product.price)} ر.س</span>
                        <ArrowUpLeft size={15} className="shrink-0 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-5 text-center text-sm text-gray-500">لا توجد منتجات مطابقة لبحثك.</p>
              )}
            </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
