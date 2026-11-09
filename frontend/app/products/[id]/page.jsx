import ProductPageClient from "../../components/ProductPageClient";

export const metadata = {
  title: "المنتج | بالمیرا",
};

export default async function ProductPage({ params }) {
  const { id } = await params;

  return <ProductPageClient productId={id} />;
}
