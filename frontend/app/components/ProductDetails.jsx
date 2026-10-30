'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, Heart, Link2, MessageSquare,
  Minus, Plus, Share2, ShoppingCart, Upload,
} from "lucide-react";

function PriceText({ price }) {
  const match = price.match(/^(.*?)([٠-٩0-9][٠-٩0-9.,٬٫]*)(\s*(?:ر\.س|ريال(?: سعودي)?))?$/u);

  if (!match) return price;

  return (
    <>
      <span>{match[1]}</span>
      <span className="text-green-700">{match[2]}{match[3]}</span>
    </>
  );
}

function HandmadeSelect({ option, value, isOpen, onToggle, onSelect }) {
  return (
    <div className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-colors ${isOpen ? "border-gray-500" : "border-gray-300 hover:border-gray-400"}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>{value || "اختر"}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
          <ChevronDown size={17} className="text-gray-500" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full z-30 mt-2 w-full origin-top overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {option.values.map((choice) => (
              <button
                key={choice}
                type="button"
                role="option"
                aria-selected={value === choice}
                onClick={() => onSelect(choice)}
                className={`block w-full cursor-pointer px-3 py-2 text-right text-sm transition-colors hover:bg-gray-100 ${value === choice ? "font-semibold text-gray-950" : "text-gray-700"}`}
              >
                {choice}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductDetails({ product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [attachment, setAttachment] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openOption, setOpenOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionsError, setOptionsError] = useState(false);
  const copiedTimeout = useRef(null);
  const gallery = product.gallery?.length ? product.gallery : Array(4).fill(product.image);
  const selectImage = (step) => setActiveImage((index) => (index + step + gallery.length) % gallery.length);

  useEffect(() => () => window.clearTimeout(copiedTimeout.current), []);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    window.clearTimeout(copiedTimeout.current);
    copiedTimeout.current = window.setTimeout(() => setCopied(false), 3000);
  };

  const addSelectedProduct = () => {
    if (product.options?.some((option) => !selectedOptions[option.label])) {
      setOptionsError(true);
      return false;
    }
    addItem(product, quantity, selectedOptions);
    setAdded(true);
    return true;
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8" dir="rtl">
      <nav aria-label="مسار التنقل" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <a href="/" className="transition-colors hover:text-gray-950">الرئيسية</a>
        <ChevronLeft size={13} />
        <a href="/" className="transition-colors hover:text-gray-950">الدروع التذكارية</a>
        <ChevronLeft size={13} />
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-8" dir="ltr">
        <section className="min-w-0" aria-labelledby="product-title" dir="rtl">
          <h1 id="product-title" className="text-2xl font-bold leading-relaxed text-[#252b35] sm:text-[28px]">
            {product.name}
          </h1>
          <p className="mt-4 text-xl font-bold text-[#202124]"><PriceText price={product.price} /></p>

          <div className="mt-7 space-y-3 text-sm leading-7 text-gray-800">
            {product.description.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>)}
            <div>
              <h2 className="mb-2 font-bold">المواصفات:</h2>
              <ul className="space-y-1.5">
                {product.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2">
                    <Check size={16} className="mt-1 shrink-0 text-[#1D1F1F]" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button type="button" className="mt-3 cursor-pointer text-sm text-blue-600 hover:text-blue-800">
            اقرأ المزيد
          </button>
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs leading-6 text-gray-500">
            {[product.name, "درع فاخر", "هدية تكريمية", "دروع كريستال"].map((tag) => (
              <span key={tag} className="underline decoration-gray-300 underline-offset-2">{tag}</span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFavorite((value) => !value)}
              aria-label={isFavorite ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
              aria-pressed={isFavorite}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition-colors hover:bg-gray-100 ${isFavorite ? "text-red-600" : "text-gray-600"}`}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label={copied ? "تم نسخ الرابط" : "نسخ رابط المنتج"}
                onClick={handleShare}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-colors ${copied ? "border-green-600 bg-green-600 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              >
                {copied ? <Check size={18} /> : <Share2 size={17} />}
              </button>
              <AnimatePresence>
                {copied && (
                  <motion.span
                    role="status"
                    dir="ltr"
                    initial={{ opacity: 0, y: 5, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 3, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
                  >
                    Copied!
                    <span aria-hidden="true" className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-gray-900" />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {product.options?.length > 0 && (
            <section className="mt-5 mb-5 space-y-4 rounded-xl bg-white p-5 sm:p-6" aria-label="خيارات المنتج">
              {product.options.map((option) => (
                <div key={option.label} className="flex items-center gap-5" dir="rtl">
                  <div className="w-24 shrink-0">
                    <p className="text-sm font-bold text-gray-700">{option.label} <span className="text-red-500">*</span></p>
                    <p className="mt-1 text-xs text-gray-500">{selectedOptions[option.label] || "اختر"}</p>
                  </div>
                  <HandmadeSelect
                    option={option}
                    value={selectedOptions[option.label]}
                    isOpen={openOption === option.label}
                    onToggle={() => setOpenOption((current) => current === option.label ? null : option.label)}
                    onSelect={(choice) => {
                      setSelectedOptions((current) => ({ ...current, [option.label]: choice }));
                      setOpenOption(null);
                      setOptionsError(false);
                    }}
                  />
                </div>
              ))}
              {optionsError && <p className="text-right text-xs text-red-600">يرجى اختيار خيارات المنتج أولاً.</p>}
            </section>
          )}

          <section className="mt-5 rounded-xl bg-white p-5 sm:p-6" aria-labelledby="attachments-title">
            <h2 id="attachments-title" className="mb-4 text-sm font-bold text-gray-700">المرفقات</h2>
            <div className="grid w-full grid-cols-2 gap-3">
              <label htmlFor="product-attachment" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#343838]">
                <Link2 size={16} className="text-gray-300" />
                {attachment || "إرفاق ملف"}
              </label>
              <input id="product-attachment" type="file" className="sr-only" onChange={(event) => setAttachment(event.target.files?.[0]?.name || "")} />
              <button type="button" onClick={() => setShowNote((value) => !value)} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#343838]">
                <MessageSquare size={16} className="text-gray-300" />
                إضافة ملاحظة
              </button>
            </div>
            {showNote && <textarea rows={3} placeholder="اكتب ملاحظتك هنا" className="mt-4 min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />}
          </section>

          <section className="mt-5 rounded-xl bg-white p-5 sm:p-6" aria-label="السعر والشراء">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-gray-700">السعر</span>
              <span className="text-lg font-extrabold text-[#202124]"><PriceText price={product.price} /></span>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-gray-700">الكمية</span>
              <div className="flex h-10 items-center overflow-hidden rounded-lg border border-gray-200" dir="ltr">
                <button type="button" aria-label="تقليل الكمية" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100"><Minus size={16} /></button>
                <span aria-live="polite" className="min-w-10 text-center font-semibold">{quantity}</span>
                <button type="button" aria-label="زيادة الكمية" onClick={() => setQuantity((value) => value + 1)} className="flex h-full w-10 cursor-pointer items-center justify-center text-gray-500 hover:bg-gray-100"><Plus size={16} /></button>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => { if (addSelectedProduct()) router.push("/cart"); }} className="min-h-11 cursor-pointer rounded-full border border-[#1D1F1F] px-4 py-2 text-sm font-bold text-[#1D1F1F] transition-colors hover:bg-[#1D1F1F]/10">اشتر الآن</button>
              <button type="button" onClick={addSelectedProduct} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#343838]">
                <ShoppingCart size={16} />{added ? `تمت الإضافة (${quantity})` : "أضف إلى السلة"}
              </button>
            </div>
          </section>
        </section>

        <section className="min-w-0" aria-label="صور المنتج" dir="rtl">
          <div className="relative overflow-hidden rounded-lg bg-[#f0f1f1]">
            <img src={gallery[activeImage]} alt={product.name} className="aspect-square w-full object-contain" />
            {gallery.length > 1 && <>
              <button type="button" aria-label="الصورة السابقة" onClick={() => selectImage(-1)} className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-600 shadow hover:text-black"><ChevronRight size={20} /></button>
              <button type="button" aria-label="الصورة التالية" onClick={() => selectImage(1)} className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-gray-600 shadow hover:text-black"><ChevronLeft size={20} /></button>
            </>}
          </div>
          {gallery.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.map((image, index) => (
              <button key={`${image}-${index}`} type="button" aria-label={`عرض الصورة ${index + 1}`} onClick={() => setActiveImage(index)} className={`overflow-hidden rounded-lg border-2 bg-gray-100 transition-colors ${activeImage === index ? "border-[#1D1F1F]" : "border-transparent"}`}>
                <img src={image} alt="" className="aspect-square w-full object-contain" />
              </button>
            ))}
          </div>}
        </section>
      </div>
    </main>
  );
}
