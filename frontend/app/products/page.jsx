import { Suspense } from "react";
import ProductsPageClient from "./ProductsPageClient";
import { API_BASE_URL } from "../lib/productApi";

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const sectionSlug = Array.isArray(params?.section) ? params.section[0] : params?.section;

  if (!sectionSlug) return { title: "جميع المنتجات" };

  try {
    const response = await fetch(`${API_BASE_URL}/sections`, { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load sections");
    const payload = await response.json();
    const section = (payload.sections || []).find((item) => item.slug === sectionSlug || String(item._id) === sectionSlug);
    return { title: section?.name || "قسم غير موجود" };
  } catch {
    return { title: "المنتجات" };
  }
}

async function ProductsPageContent({ searchParams }) {
  const params = await searchParams;
  const sectionSlug = Array.isArray(params?.section) ? params.section[0] : params?.section || "";

  return <ProductsPageClient key={sectionSlug} initialSectionSlug={sectionSlug} />;
}

export default function ProductsPage({ searchParams }) {
  return (
    <Suspense fallback={<main className="mx-auto min-h-[55vh] max-w-7xl px-4 py-16 text-center text-sm text-gray-500">جارٍ تحميل المنتجات…</main>}>
      <ProductsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
