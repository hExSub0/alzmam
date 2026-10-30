'use client';

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Link from "next/link";
import { products } from "../data/products";
import { useCart } from "./CartProvider";
import "swiper/css";

function PriceText({ price }) {
  const match = price.match(/^(.*?)([٠-٩0-9][٠-٩0-9.,٬٫]*)(\s*(?:ر\.س|ريال(?: سعودي)?))?$/u);

  if (!match) return price;

  return (
    <>
      <span>{match[1]}</span>
      <span className="text-green-700">{match[2]}{match[3]}</span>
    </>
  );
}

export default function LatestProducts() {
  const swiperRef = useRef(null);
  const [favorites, setFavorites] = useState({});
  const { addItem } = useCart();

  return (
    <section aria-labelledby="latest-products-title" className="mx-auto my-10 w-[75%] max-w-[1200px]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="latest-products-title" className="text-lg font-bold text-gray-900">
            أحدث المنتجات
        </h2>
        <div className="flex items-center gap-3">
          <a
            href="https://palmera-adv.com/ar/latest-products"
            className="text-base text-gray-600 transition-colors hover:text-gray-950"
          >
            عرض الكل
          </a>
          <button
            type="button"
            aria-label="المنتج السابق"
            onClick={() => swiperRef.current?.slidePrev()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-gray-900 hover:text-black"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            aria-label="المنتج التالي"
            onClick={() => swiperRef.current?.slideNext()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-colors hover:border-gray-900 hover:text-black"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      <Swiper
        modules={[Autoplay]}
        dir="rtl"
        onSwiper={(swiper) => { swiperRef.current = swiper; }}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        slidesPerView={1.4}
        spaceBetween={12}
        breakpoints={{
          480: { slidesPerView: 2, spaceBetween: 16 },
          768: { slidesPerView: 3, spaceBetween: 16 },
          1024: { slidesPerView: 4, spaceBetween: 20 },
        }}
        className="!overflow-hidden"
      >
        {products.map((product) => (
          <SwiperSlide key={product.name} className="h-auto">
            <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                <Link href={`/products/${product.id}`} aria-label={product.name} className="block h-full w-full">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </Link>
                <button
                  type="button"
                  aria-label={favorites[product.name] ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
                  aria-pressed={Boolean(favorites[product.name])}
                  onClick={() => setFavorites((current) => ({
                    ...current,
                    [product.name]: !current[product.name],
                  }))}
                  className={`absolute right-3 top-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-md transition-all duration-200 hover:scale-110 focus-visible:opacity-100 ${favorites[product.name] ? "text-red-600 opacity-100" : "text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-600"}`}
                >
                  <Heart size={19} fill={favorites[product.name] ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-4 text-center" dir="rtl">
                <Link href={`/products/${product.id}`} className="text-gray-800 transition-colors group-hover:text-black">
                  <h3 className="line-clamp-2 text-center text-base font-bold">
                  {product.name}
                  </h3>
                </Link>
                <p className="mt-2 text-center text-base font-extrabold text-gray-900"><PriceText price={product.price} /></p>
                <button
                  type="button"
                  onClick={() => addItem(product)}
                  className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1D1F1F] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#343838]"
                >
                  <ShoppingCart size={16} />
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
