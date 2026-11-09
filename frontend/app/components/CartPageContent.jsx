'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FileText, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatCurrency, useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import AuthPage from "./AuthPage";
import { getProductImageUrl } from "../lib/productApi";

export default function CartPageContent() {
  const router = useRouter();
  const { user, isReady: authReady } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const { items, total, hasUnpricedItems, ready, setItemQuantity, removeItem, clearCart } = useCart();

  const continueToCheckout = () => {
    if (!user) {
      setAuthMode("login");
      return;
    }

    router.push("/checkout");
  };

  return (
    <main className="mx-auto min-h-[55vh] w-full max-w-6xl px-4 py-10 sm:px-6" dir="rtl">
      <h1 className="mb-7 text-2xl font-bold text-gray-900">سلة التسوق</h1>

      {!ready ? (
        <div className="rounded-xl bg-white p-8 text-center text-gray-500">جارٍ تحميل السلة...</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-white px-6 py-14 text-center shadow-sm">
          <ShoppingBag size={38} className="mb-4 text-gray-400" />
          <p className="mb-5 text-gray-600">سلتك فارغة حاليًا.</p>
          <Link href="/" className="rounded-full bg-[#1D1F1F] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#343838]">تابع التسوق</Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-xl bg-white shadow-sm" aria-label="منتجات السلة">
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <article key={item.key} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5">
                  <Link href={`/products/${item.slug || item.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                    <img src={item.image} alt={item.name} width={96} height={96} className="h-full w-full object-contain" />
                  </Link>
                  <div className="min-w-[150px] flex-1">
                    <Link href={`/products/${item.slug || item.id}`} className="font-bold text-gray-900 transition-colors hover:text-gray-600">{item.name}</Link>
                    <p className="mt-1 text-sm font-semibold text-green-700">{item.price}</p>
                    {Object.entries(item.options || {}).map(([label, value]) => <p key={label} className="mt-1 text-xs text-gray-500">{label}: {value}</p>)}
                    {item.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-gray-600"><span className="font-semibold">ملاحظة: </span>{item.note}</p>}
                    {item.attachments?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{item.attachments.map((attachment) => <a key={attachment.url} href={getProductImageUrl(attachment.url)} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"><FileText size={13} className="shrink-0" /><span className="max-w-36 truncate">{attachment.name}</span></a>)}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-gray-200" dir="ltr">
                      <button type="button" aria-label="تقليل الكمية" onClick={() => setItemQuantity(item.key, item.quantity - 1)} className="flex h-full w-9 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100"><Minus size={14} /></button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" aria-label="زيادة الكمية" onClick={() => setItemQuantity(item.key, item.quantity + 1)} className="flex h-full w-9 cursor-pointer items-center justify-center text-gray-600 hover:bg-gray-100"><Plus size={14} /></button>
                    </div>
                    <button type="button" aria-label="حذف المنتج من السلة" onClick={() => removeItem(item.key)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                  </div>
                </article>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 text-left">
              <button type="button" onClick={clearCart} className="cursor-pointer text-sm text-gray-500 transition-colors hover:text-red-600">إفراغ السلة</button>
            </div>
          </section>

          <aside className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-900">ملخص الطلب</h2>
            <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
              <span>عدد المنتجات</span>
              <span>{items.reduce((count, item) => count + item.quantity, 0)}</span>
            </div>
            <div className="my-4 h-px bg-gray-100" />
            <div className="flex items-center justify-between gap-3 font-bold text-gray-900">
              <span>الإجمالي</span>
              <span className="text-green-700">{hasUnpricedItems ? "يحدد حسب خيارات المنتج" : formatCurrency(total)}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-gray-500">تُضاف أسعار الخيارات إلى السعر الأساسي بعد اختيارها من صفحة المنتج.</p>
            <button type="button" disabled={!authReady} onClick={continueToCheckout} className="mt-6 w-full cursor-pointer rounded-full bg-[#1D1F1F] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#343838] disabled:cursor-wait disabled:opacity-60">متابعة إتمام الطلب</button>
          </aside>
        </div>
      )}
      <AnimatePresence>
        {authMode && (
          <AuthPage
            mode={authMode}
            modal
            onClose={() => setAuthMode(null)}
            onModeChange={setAuthMode}
            onLoginSuccess={() => router.push("/checkout")}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
