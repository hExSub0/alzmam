import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import TopHeader from "./components/TopHeader";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <TopHeader />
      <Header />

      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6" dir="rtl">
        <section className="w-full max-w-2xl text-center">
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#1D1F1F]/10 bg-white text-[#1D1F1F] shadow-sm">
            <Search size={32} strokeWidth={1.6} />
          </div>

          <p className="text-sm font-semibold tracking-[0.25em] text-gray-500">404</p>
          <h1 className="mt-3 text-3xl font-bold text-[#1D1F1F] sm:text-4xl">
            الصفحة غير موجودة
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
            يبدو أن الصفحة التي تبحث عنها غير متاحة أو تم نقلها. يمكنك العودة إلى الصفحة الرئيسية أو تصفح منتجاتنا.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1D1F1F] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#343838]"
            >
              <Home size={17} />
              الصفحة الرئيسية
            </Link>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-sm font-semibold text-[#1D1F1F] transition-colors hover:border-gray-500 hover:bg-gray-50"
            >
              تصفح المنتجات
              <ArrowLeft size={17} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
