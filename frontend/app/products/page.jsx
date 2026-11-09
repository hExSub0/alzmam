"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import TopHeader from "../components/TopHeader";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { useFavorites } from "../components/FavoritesProvider";
import { API_BASE_URL, getProductStartingPrice, normalizeProduct } from "../lib/productApi";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const { user } = useAuth();
  const { addItem } = useCart();
  const { favoriteIds, pendingProductIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "تعذر تحميل المنتجات.");
        }

        const normalizedProducts = (payload.products || []).map(normalizeProduct);
        const sectionId = new URLSearchParams(window.location.search).get("section") || "";
        setSelectedSection(sectionId);
        setProducts(sectionId
          ? normalizedProducts.filter((product) => String(product.section || product.sectionId || "") === sectionId)
          : normalizedProducts);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMessage(error.message || "تعذر تحميل المنتجات.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProducts();
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <TopHeader />
      <Header />
      <main className="mx-auto min-h-[55vh] w-full max-w-7xl px-4 py-10 sm:px-6" dir="rtl">
        <h1 className="mb-7 text-2xl font-bold text-[#1D1F1F]">{selectedSection ? "منتجات القسم" : "جميع المنتجات"}</h1>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-gray-500">جارٍ تحميل المنتجات…</p>
        ) : errorMessage ? (
          <p role="alert" className="py-16 text-center text-sm text-red-600">{errorMessage}</p>
        ) : products.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">لا توجد منتجات متاحة حاليًا.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                  <Link href={`/products/${product.slug}`} aria-label={product.name} className="block h-full w-full">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </Link>
                  <button
                    type="button"
                    aria-label={favoriteIds.has(product.id) ? "إزالة من قائمة الأمنيات" : "أضف إلى قائمة الأمنيات"}
                    aria-pressed={favoriteIds.has(product.id)}
                    disabled={pendingProductIds.has(product.id)}
                    onClick={() => user ? toggleFavorite(product) : router.push("/login")}
                    className={`absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-md transition-all duration-200 hover:scale-110 focus-visible:opacity-100 disabled:cursor-wait disabled:opacity-60 ${favoriteIds.has(product.id) ? "text-red-600 opacity-100" : "text-gray-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-red-600"}`}
                  >
                    <Heart size={19} fill={favoriteIds.has(product.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="p-4 text-center">
                  <Link href={`/products/${product.slug}`} className="text-gray-800 transition-colors group-hover:text-black">
                    <h2 className="line-clamp-2 text-center text-base font-bold">{product.name}</h2>
                  </Link>
                  <p className="mt-2 text-center text-base font-extrabold">
                    <span className="text-green-700">
                      {product.options?.length > 0 && <span className="ml-1 text-sm font-medium text-gray-500">يبدأ من</span>}
                      {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(getProductStartingPrice(product))} ر.س
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => product.options?.length ? router.push(`/products/${product.slug}`) : addItem(product)}
                    className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1D1F1F] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#343838]"
                  >
                    {product.options?.length ? null : <ShoppingCart size={16} />}
                    {product.options?.length ? "أضف إلى السلة" : "أضف إلى السلة"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
