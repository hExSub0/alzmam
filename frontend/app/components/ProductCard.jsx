"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "./FavoritesProvider";
import { getProductStartingPrice } from "../lib/productApi";
import QuickAddButton from "./QuickAddButton";

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { favoriteIds, pendingProductIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.has(product.id);
  const hasOptions = product.options?.length > 0;
  const price = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(getProductStartingPrice(product));

  return <article className="group h-full overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-sm">
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
      <Link href={`/products/${product.slug}`} aria-label={product.name} className="block h-full w-full">
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]" />
      </Link>
      <button type="button" aria-label={isFavorite ? "إزالة من قائمة الأمنيات" : "أضف إلى قائمة الأمنيات"} aria-pressed={isFavorite} disabled={pendingProductIds.has(product.id)} onClick={() => user ? toggleFavorite(product) : router.push("/login")} className={`absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm transition-all duration-200 hover:scale-110 disabled:cursor-wait disabled:opacity-60 ${isFavorite ? "text-red-600" : "text-gray-600 opacity-90 hover:text-red-600"}`}>
        <Heart size={19} fill={isFavorite ? "currentColor" : "none"} />
      </button>
    </div>
    <div className="p-4 text-center" dir="rtl">
      <Link href={`/products/${product.slug}`} className="text-gray-800 transition-colors group-hover:text-black"><h3 className="line-clamp-2 min-h-12 text-base font-bold">{product.name}</h3></Link>
      <p className="mt-0.5 text-base font-extrabold text-gray-900">{hasOptions && <span className="ml-1 text-sm font-medium text-gray-500">يبدأ من</span>}<span className="text-green-700">{price} ر.س</span></p>
      <QuickAddButton product={product} addItem={addItem} className="mt-4 w-full" />
    </div>
  </article>;
}
