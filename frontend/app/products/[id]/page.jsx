import { notFound } from "next/navigation";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import ProductDetails from "../../components/ProductDetails";
import TopHeader from "../../components/TopHeader";
import { products } from "../../data/products";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  return product ? { title: `${product.name} | بالميرا` } : { title: "المنتج غير موجود | بالميرا" };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);

  if (!product) notFound();

  return (
    <>
      <TopHeader />
      <Header />
      <ProductDetails product={product} />
      <Footer />
    </>
  );
}
