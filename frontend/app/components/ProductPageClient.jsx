"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import ProductDetails from "./ProductDetails";
import TopHeader from "./TopHeader";
import { API_BASE_URL, normalizeProduct } from "../lib/productApi";

export default function ProductPageClient({ productId }) {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error?.message || "تعذر تحميل المنتج.");
        }

        setProduct(normalizeProduct(payload.product));
      } catch (error) {
        if (error.name !== "AbortError") setErrorMessage(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadProduct();
    return () => controller.abort();
  }, [productId]);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <TopHeader />
      <Header />
      {isLoading ? (
        <main className="grid min-h-[50vh] place-items-center px-4 text-sm text-gray-500">جارٍ تحميل المنتج…</main>
      ) : product ? (
        <ProductDetails product={product} />
      ) : (
        <main className="grid min-h-[50vh] place-items-center px-4 text-center">
          <div><h1 className="text-xl font-bold text-[#1D1F1F]">المنتج غير موجود</h1><p className="mt-2 text-sm text-gray-500">{errorMessage}</p></div>
        </main>
      )}
      <Footer />
    </div>
  );
}
