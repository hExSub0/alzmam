import { Suspense } from "react";
import ProductPageClient from "../../components/ProductPageClient";
import { API_BASE_URL } from "../../lib/productApi";

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const response = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Product not found");
    const { product } = await response.json();
    return { title: product?.name || "\u0627\u0644\u0645\u0646\u062a\u062c" };
  } catch {
    return { title: "\u0627\u0644\u0645\u0646\u062a\u062c" };
  }
}

async function ProductPageContent({ params }) {
  const { id } = await params;

  return <ProductPageClient productId={id} />;
}

export default function ProductPage({ params }) {
  return (
    <Suspense fallback={null}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}
