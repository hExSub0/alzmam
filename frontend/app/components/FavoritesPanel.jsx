"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";
import { useFavorites } from "./FavoritesProvider";
import { getProductStartingPrice } from "../lib/productApi";

export default function FavoritesPanel() {
  const router = useRouter();
  const { addItem } = useCart();
  const {
    favoriteProducts,
    pendingProductIds,
    errorMessage,
    isLoading,
    toggleFavorite,
  } = useFavorites();

  if (isLoading) {
    return <p className="py-16 text-center text-sm text-gray-500">جارٍ تحميل قائمة الأمنيات…</p>;
  }

  if (errorMessage && favoriteProducts.length === 0) {
    return <p role="alert" className="py-16 text-center text-sm text-red-600">{errorMessage}</p>;
  }

  if (favoriteProducts.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center">
        <Heart size={30} className="mx-auto text-gray-400" />
        <p className="mt-4 text-gray-600">لم تضف أي منتجات إلى قائمة الأمنيات بعد.</p>
        <Link href="/products" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1D1F1F] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#343838]">
          تصفح المنتجات
        </Link>
      </section>
    );
  }

  return (
    <>
      {errorMessage && <p role="alert" className="mb-4 text-sm text-red-600">{errorMessage}</p>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {favoriteProducts.map((product) => (
          <article key={product.id} className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
              <Link href={`/products/${product.slug}`} aria-label={product.name} className="block h-full w-full">
                <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              </Link>
              <button
                type="button"
                aria-label="إزالة من قائمة الأمنيات"
                disabled={pendingProductIds.has(product.id)}
                onClick={() => toggleFavorite(product)}
                className="absolute right-3 top-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 text-red-600 shadow-md transition-transform hover:scale-110 disabled:cursor-wait disabled:opacity-60"
              >
                <Heart size={19} fill="currentColor" />
              </button>
            </div>
            <div className="p-4 text-center">
              <Link href={`/products/${product.slug}`} className="text-gray-800 transition-colors group-hover:text-black">
                <h2 className="line-clamp-2 text-center text-base font-bold">{product.name}</h2>
              </Link>
              <p className="mt-2 text-base font-extrabold text-green-700">
                {product.options?.length > 0 && <span className="ml-1 text-sm font-medium text-gray-500">يبدأ من</span>}
                {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(getProductStartingPrice(product))} ر.س
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
    </>
  );
}
