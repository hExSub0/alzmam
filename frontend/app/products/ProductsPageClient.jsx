"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Heart, Search, SlidersHorizontal } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import TopHeader from "../components/TopHeader";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { useFavorites } from "../components/FavoritesProvider";
import { API_BASE_URL, getProductStartingPrice, normalizeProduct } from "../lib/productApi";
import QuickAddButton from "../components/QuickAddButton";

const normalizeText = (value) => String(value || "")
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670]/g, "")
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .toLocaleLowerCase("ar");

const sortOptions = [
  { value: "recommended", label: "مقترحاتنا" },
  { value: "price-asc", label: "السعر: الأقل أولاً" },
  { value: "price-desc", label: "السعر: الأعلى أولاً" },
  { value: "name", label: "الاسم" },
];

export default function ProductsPageClient({ initialSectionSlug = "" }) {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSectionSlug, setSelectedSectionSlug] = useState(initialSectionSlug);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("recommended");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortMenuRef = useRef(null);
  const [showAllSections, setShowAllSections] = useState(false);
  const { user } = useAuth();
  const { addItem } = useCart();
  const { favoriteIds, pendingProductIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (!isSortOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) setIsSortOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsSortOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSortOpen]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch(`${API_BASE_URL}/products`, { signal: controller.signal, cache: "no-store" }),
      fetch(`${API_BASE_URL}/sections`, { signal: controller.signal, cache: "no-store" }),
    ])
      .then(async ([productResponse, sectionResponse]) => {
        const productPayload = await productResponse.json();
        const sectionPayload = await sectionResponse.json();
        if (!productResponse.ok) throw new Error(productPayload?.error?.message || "تعذر تحميل المنتجات.");
        if (!sectionResponse.ok) throw new Error(sectionPayload?.error?.message || "تعذر تحميل الأقسام.");
        setAllProducts((productPayload.products || []).map(normalizeProduct));
        setSections(sectionPayload.sections || []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setErrorMessage(error.message || "تعذر تحميل المنتجات.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const selectedSection = sections.find((section) => section.slug === selectedSectionSlug || String(section._id) === selectedSectionSlug);
  const sectionCounts = useMemo(() => {
    const counts = new Map();
    for (const product of allProducts) {
      const sectionId = String(product.section || product.sectionId || "");
      counts.set(sectionId, (counts.get(sectionId) || 0) + 1);
    }
    return counts;
  }, [allProducts]);

  const visibleSections = useMemo(() => {
    const matchingSections = sections.filter((section) => normalizeText(section.name).includes(normalizeText(categorySearch)));
    return showAllSections || categorySearch ? matchingSections : matchingSections.slice(0, 8);
  }, [sections, categorySearch, showAllSections]);

  const visibleProducts = useMemo(() => {
    const sectionProducts = selectedSection
      ? allProducts.filter((product) => String(product.section || product.sectionId || "") === String(selectedSection._id))
      : selectedSectionSlug
        ? []
        : allProducts;
    const query = normalizeText(productSearch.trim());
    const filtered = query
      ? sectionProducts.filter((product) => normalizeText(`${product.name} ${product.description}`).includes(query))
      : sectionProducts;

    return [...filtered].sort((first, second) => {
      if (sortOrder === "price-asc") return getProductStartingPrice(first) - getProductStartingPrice(second);
      if (sortOrder === "price-desc") return getProductStartingPrice(second) - getProductStartingPrice(first);
      if (sortOrder === "name") return first.name.localeCompare(second.name, "ar");
      return 0;
    });
  }, [allProducts, productSearch, selectedSection, selectedSectionSlug, sortOrder]);

  const selectSection = (section) => {
    const slug = section?.slug || "";
    setSelectedSectionSlug(slug);
    router.push(slug ? `/products?section=${encodeURIComponent(slug)}` : "/products");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f6]">
      <TopHeader />
      <Header />
      <main className="mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-7 sm:px-6 lg:py-10" dir="rtl">
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="transition-colors hover:text-gray-900">الرئيسية</Link>
          <span aria-hidden="true">‹</span>
          <span className="text-gray-800">{selectedSection?.name || "جميع المنتجات"}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm" aria-label="تصفية المنتجات">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-gray-900">فئات المنتجات</h2>
              <SlidersHorizontal size={17} className="text-[#ad8b52]" />
            </div>
            <label className="relative mt-4 block">
              <span className="sr-only">ابحث عن فئة</span>
              <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} placeholder="ابحث عن فئة" className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-9 pl-3 text-sm outline-none transition focus:border-[#b69a68]" />
            </label>
            <div className="mt-4 space-y-1">
              <button type="button" onClick={() => selectSection(null)} className={`flex min-h-9 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-right text-sm transition hover:bg-gray-50 ${!selectedSectionSlug ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                <span>جميع المنتجات</span><span className="text-xs text-gray-400">{allProducts.length}</span>
              </button>
              {visibleSections.map((section) => (
                <button key={section._id} type="button" onClick={() => selectSection(section)} aria-pressed={selectedSectionSlug === section.slug || selectedSectionSlug === String(section._id)} className={`flex min-h-9 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-right text-sm transition hover:bg-gray-50 ${selectedSectionSlug === section.slug || selectedSectionSlug === String(section._id) ? "font-semibold text-[#8e703e]" : "text-gray-600"}`}>
                  <span className="flex min-w-0 items-center gap-2"><span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selectedSectionSlug === section.slug || selectedSectionSlug === String(section._id) ? "border-[#ad8b52] bg-[#ad8b52]" : "border-gray-300"}`}>{(selectedSectionSlug === section.slug || selectedSectionSlug === String(section._id)) && <Check size={12} strokeWidth={3} className="text-white" />}</span><span className="truncate">{section.name}</span></span>
                  <span className="shrink-0 text-xs text-gray-400">{sectionCounts.get(String(section._id)) || 0}</span>
                </button>
              ))}
              {!visibleSections.length && <p className="px-2 py-3 text-sm text-gray-400">لا توجد فئات مطابقة.</p>}
            </div>
            {sections.length > 8 && !categorySearch && (
              <button type="button" onClick={() => setShowAllSections((value) => !value)} className="mt-3 cursor-pointer px-2 text-sm font-medium text-[#ad8b52] hover:text-[#806332]">
                {showAllSections ? "عرض أقل" : "عرض المزيد"}
              </button>
            )}
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{selectedSection?.name || (selectedSectionSlug ? "القسم غير موجود" : "جميع المنتجات")}</h1>
                {!isLoading && <p className="mt-1 text-sm text-gray-500">{selectedSection?.name || !selectedSectionSlug ? `${visibleProducts.length} منتج` : "تحقق من رابط القسم."}</p>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 sm:w-64">
                  <span className="sr-only">ابحث في المنتجات</span>
                  <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="ابحث في المنتجات" className="h-10 w-full rounded-lg border border-gray-200 bg-white pr-9 pl-3 text-sm outline-none transition focus:border-[#b69a68]" />
                </label>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="shrink-0">ترتيب حسب</span>
                  <div ref={sortMenuRef} className="relative min-w-40">
                    <button type="button" aria-haspopup="listbox" aria-expanded={isSortOpen} onClick={() => setIsSortOpen((open) => !open)} className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 text-right text-sm text-gray-700 transition hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b69a68]/30">
                      <span>{sortOptions.find((option) => option.value === sortOrder)?.label}</span>
                      <ChevronDown size={16} className={`shrink-0 text-gray-500 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isSortOpen && (
                        <motion.div role="listbox" aria-label="خيارات الترتيب" initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: "easeOut" }} className="absolute left-0 top-full z-30 mt-2 w-full origin-top-left overflow-hidden rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
                          {sortOptions.map((option) => (
                            <button key={option.value} type="button" role="option" aria-selected={sortOrder === option.value} onClick={() => { setSortOrder(option.value); setIsSortOpen(false); }} className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-right text-sm transition-colors hover:bg-gray-50 ${sortOrder === option.value ? "font-semibold text-[#8e703e]" : "text-gray-700"}`}>
                              {option.label}
                              {sortOrder === option.value && <Check size={15} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <p className="rounded-xl bg-white py-16 text-center text-sm text-gray-500">جارٍ تحميل المنتجات…</p>
            ) : errorMessage ? (
              <p role="alert" className="rounded-xl bg-white py-16 text-center text-sm text-red-600">{errorMessage}</p>
            ) : visibleProducts.length === 0 ? (
              <p className="rounded-xl bg-white py-16 text-center text-sm text-gray-500">لا توجد منتجات مطابقة لبحثك.</p>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <article key={product.id} className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                      <Link href={`/products/${product.slug}`} aria-label={product.name} className="block h-full w-full">
                        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      </Link>
                      <button type="button" aria-label={favoriteIds.has(product.id) ? "إزالة من قائمة الأمنيات" : "أضف إلى قائمة الأمنيات"} aria-pressed={favoriteIds.has(product.id)} disabled={pendingProductIds.has(product.id)} onClick={() => user ? toggleFavorite(product) : router.push("/login")} className={`absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-md transition-all duration-200 hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${favoriteIds.has(product.id) ? "text-red-600" : "text-gray-600 hover:text-red-600"}`}>
                        <Heart size={19} fill={favoriteIds.has(product.id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="p-4 text-center">
                      <Link href={`/products/${product.slug}`} className="text-gray-800 transition-colors group-hover:text-black">
                        <h2 className="line-clamp-2 min-h-12 text-center text-sm font-bold leading-6">{product.name}</h2>
                      </Link>
                      <p className="mt-2 text-center text-base font-extrabold text-gray-900">
                        {product.options?.length > 0 && <span className="ml-1 text-sm font-medium text-gray-500">يبدأ من</span>}
                        {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(getProductStartingPrice(product))} ر.س
                      </p>
                      <QuickAddButton product={product} addItem={addItem} className="mt-4 w-full" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
