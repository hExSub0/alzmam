import Footer from "../components/Footer";
import Header from "../components/Header";
import CartPageContent from "../components/CartPageContent";
import TopHeader from "../components/TopHeader";

export const metadata = { title: "سلة التسوق | بالميرا" };

export default function CartPage() {
  return (
    <>
      <TopHeader />
      <Header />
      <CartPageContent />
      <Footer />
    </>
  );
}
