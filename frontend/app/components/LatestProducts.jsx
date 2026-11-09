"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Link from "next/link";
import { API_BASE_URL, normalizeProduct } from "../lib/productApi";
import ProductCard from "./ProductCard";
import "swiper/css";

export default function LatestProducts() {
  const swiperRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "تعذر تحميل المنتجات.");
        }

        setProducts((payload.products || []).map(normalizeProduct));
        setLoadError("");
      } catch (error) {
        if (error.name !== "AbortError") {
          setLoadError(error.message || "تعذر تحميل المنتجات.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProducts(false);
        }
      }
    };

    loadProducts();
    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="latest-products-title" dir="rtl" className="mx-auto my-10 w-[92%] max-w-[1200px] sm:w-[88%]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="latest-products-title" className="text-lg font-bold text-gray-900">
          أحدث المنتجات
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="text-base text-gray-600 transition-colors hover:text-gray-950"
          >
            عرض الكل
          </Link>
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

      {isLoadingProducts ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500">
          جارٍ تحميل المنتجات…
        </div>
      ) : loadError ? (
        <div role="alert" className="grid min-h-48 place-items-center rounded-xl border border-gray-200 bg-white px-4 text-center text-sm text-gray-600">
          {loadError}
        </div>
      ) : products.length === 0 ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-gray-200 bg-white px-4 text-center text-sm text-gray-500">
          لا توجد منتجات متاحة حاليًا.
        </div>
      ) : (
        <Swiper
          modules={[Autoplay]}
          dir="rtl"
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          loop={products.length > 3}
          autoplay={products.length > 1 ? { delay: 5000, disableOnInteraction: false } : false}
          slidesPerView="auto"
          spaceBetween={16}
          className="!overflow-hidden"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="!h-auto !w-[min(82vw,230px)] sm:!w-[245px]">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
