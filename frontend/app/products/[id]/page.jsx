import { Suspense } from "react";
import ProductPageClient from "../../components/ProductPageClient";

export const metadata = {
  title: "المنتج | بالمیرا",
};

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
