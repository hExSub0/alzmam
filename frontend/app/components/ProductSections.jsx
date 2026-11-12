"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import Link from "next/link";
import LatestProducts from "./LatestProducts";
import ProductCard from "./ProductCard";
import { API_BASE_URL, getProductImageUrl, normalizeProduct } from "../lib/productApi";

export default function ProductSections() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const swiperRefs = useRef(new Map());

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${API_BASE_URL}/sections`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : { sections: [] }),
      fetch(`${API_BASE_URL}/products`, { cache: "no-store", signal: controller.signal }).then((response) => response.ok ? response.json() : { products: [] }),
    ]).then(([sectionPayload, productPayload]) => {
      setSections(sectionPayload.sections || []);
      setProducts((productPayload.products || []).map(normalizeProduct));
    }).catch((error) => { if (error.name !== "AbortError") setSections([]); })
      .finally(() => { if (!controller.signal.aborted) setLoaded(true); });
    return () => controller.abort();
  }, []);

  const productsBySection = useMemo(() => {
    const grouped = new Map();
    for (const product of products) {
      const sectionId = String(product.section || product.sectionId || "");
      if (!grouped.has(sectionId)) grouped.set(sectionId, []);
      grouped.get(sectionId).push(product);
    }
    return grouped;
  }, [products]);
  const displaySections = useMemo(() => [
    ...sections,
    ...(productsBySection.get("")?.length ? [{ _id: "unassigned", name: "منتجات أخرى" }] : []),
  ], [sections, productsBySection]);

  if (!loaded) return <LatestProducts />;

  return <>
    <LatestProducts />
    <div className="mx-auto my-8 w-[92%] max-w-[1200px] space-y-10 sm:w-[88%]" dir="rtl">
    {displaySections.map((section) => {
      const sectionProducts = productsBySection.get(section._id === "unassigned" ? "" : String(section._id)) || [];
      const bannerSrc = section.banner?.src?.startsWith("/uploads/")
        ? getProductImageUrl(section.banner.src)
        : section.banner?.src;
      return <section key={section._id} aria-labelledby={`section-${section._id}`}>
        {bannerSrc && (section.banner.link
          ? <a href={section.banner.link} className="mb-4 block overflow-hidden rounded-md" aria-label={section.banner.alt || section.name}><img src={bannerSrc} alt={section.banner.alt || section.name} className="block aspect-[16/6] w-full object-cover transition-transform duration-300 hover:scale-[1.01]" /></a>
          : <img src={bannerSrc} alt={section.banner.alt || section.name} className="mb-4 block aspect-[16/6] w-full rounded-md object-cover" />)}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={`section-${section._id}`} className="text-lg font-bold text-gray-900">{section.name}</h2>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={section._id === "unassigned" ? "/products" : `/products?section=${encodeURIComponent(section._id)}`} className="cursor-pointer text-sm text-gray-600 transition-colors hover:text-gray-950">عرض الكل</Link>
            <button type="button" aria-label={`المنتجات السابقة في ${section.name}`} onClick={() => swiperRefs.current.get(String(section._id))?.slidePrev()} disabled={sectionProducts.length <= 1} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-gray-900 hover:text-black disabled:cursor-pointer disabled:opacity-40"><ChevronRight size={18} /></button>
            <button type="button" aria-label={`المنتجات التالية في ${section.name}`} onClick={() => swiperRefs.current.get(String(section._id))?.slideNext()} disabled={sectionProducts.length <= 1} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-gray-300 text-gray-700 transition hover:border-gray-900 hover:text-black disabled:cursor-pointer disabled:opacity-40"><ChevronLeft size={18} /></button>
          </div>
        </div>
        {sectionProducts.length ? <Swiper
          dir="rtl"
          onSwiper={(swiper) => swiperRefs.current.set(String(section._id), swiper)}
          loop={sectionProducts.length > 3}
          slidesPerView="auto"
          spaceBetween={16}
          className="!overflow-hidden"
        >{sectionProducts.map((product) => <SwiperSlide key={product.id} className="!h-auto !w-[min(82vw,230px)] sm:!w-[245px]"><ProductCard product={product} /></SwiperSlide>)}</Swiper> : <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">لا توجد منتجات في هذا القسم بعد.</p>}
      </section>;
    })}
    </div>
  </>;
}
