"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpLeft, Search, X } from "lucide-react";
import { products } from "../data/products";

const searchChips = ["دروع كريستال", "مجسمات", "هدايا تذكارية", "دروع فاخرة"];
const popularProducts = products.slice(0, 5);

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
  const searchInputRef = useRef(null);
  const router = useRouter();
  const normalizedQuery = normalizeSearch(searchQuery.trim());
  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return popularProducts;
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
  }, [normalizedQuery, searchQuery, popularProducts]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsSearchOpen(false);
      if (event.key === "Enter" && filteredProducts[0]) {
        setIsSearchOpen(false);
        router.push(`/products/${filteredProducts[0].id}`);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, filteredProducts, router]);

  const closeSearch = () => setIsSearchOpen(false);

  return (
    <>
      <div className="h-12 w-full bg-[#1D1F1F] text-gray-300">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-4">
          <div className="flex shrink-0 items-center gap-4 text-sm">
            <a href="#" className="text-gray-200 transition-colors hover:text-white">من نحن</a>
            <span aria-hidden="true" className="h-4 w-px bg-white/15" />
            <a href="#" className="text-gray-200 transition-colors hover:text-white">سياسة الخصوصية</a>
            <span aria-hidden="true" className="h-4 w-px bg-white/15" />
            <a href="#" className="text-gray-200 transition-colors hover:text-white">الشروط والأحكام</a>
          </div>

          <button type="button" onClick={() => setIsSearchOpen(true)} className="w-[min(38vw,44rem)] shrink-0 text-right">
            <span className="relative flex items-center">
              <Search size={14} className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
              <span dir="rtl" className="flex h-9 w-full items-center rounded-full bg-[#303232] pr-[35px] pl-3 text-xs text-gray-400 transition-colors hover:bg-[#3a3c3c]">{searchQuery || "ابحث"}</span>
            </span>
          </button>

          <a href="mailto:palmera@palmera-adv.com" dir="ltr" className="shrink-0 text-xs text-gray-200 transition-colors hover:text-white">
            palmera@palmera-adv.com
          </a>
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
                      <Link href={`/products/${product.id}`} onClick={closeSearch} className="flex items-center gap-3 py-2.5 text-sm text-gray-600 transition-colors hover:text-gray-950">
                        <Search size={15} className="shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1 truncate">{product.name}</span>
                        <span className="hidden shrink-0 text-xs text-gray-400 sm:inline">{product.price}</span>
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
