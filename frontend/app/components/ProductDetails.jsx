'use client';

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "./FavoritesProvider";
import { getProductPrice, getProductStartingPrice } from "../lib/productApi";
import {
  Check, ChevronDown, ChevronLeft, ChevronRight, FileText, Heart, Link2, LoaderCircle, MessageSquare,
  Minus, Plus, Share2, ShoppingCart, Trash2,
} from "lucide-react";

function PriceText({ price }) {
  return <span className="text-green-700">{new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(Number(price))} ر.س</span>;
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
            {option.values.map((choice, choiceIndex) => (
              <button
                key={choice}
                type="button"
                role="option"
                aria-selected={value === choice}
                onClick={() => onSelect(choice)}
                className={`block w-full cursor-pointer px-3 py-2 text-right text-sm transition-colors hover:bg-gray-100 ${value === choice ? "font-semibold text-gray-950" : "text-gray-700"}`}
              >
                <span>{choice}</span>
                {(option.valuePricingModes?.[choiceIndex] || option.pricingMode) !== "none" && (
                  <span className="text-xs text-gray-500">
                    {(option.valuePricingModes?.[choiceIndex] || option.pricingMode) === "fixed" ? "السعر النهائي: " : "+ "}
                    {new Intl.NumberFormat("ar-SA").format(option.valuePrices?.[choiceIndex] || 0)} ر.س
                  </span>
                )}
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
  const { user, request } = useAuth();
  const { favoriteIds, pendingProductIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.has(product.id);
  const [quantity, setQuantity] = useState(1);
  const [attachments, setAttachments] = useState([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openOption, setOpenOption] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionsError, setOptionsError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const copiedTimeout = useRef(null);
  const gallery = product.gallery?.length ? product.gallery : [product.image].filter(Boolean);
  const description = product.description || "";
  const shouldShowReadMore = description.length > 200;
  const visibleDescription = shouldShowReadMore && !isDescriptionExpanded
    ? description.slice(0, 200)
    : description;
  const selectedPrice = getProductPrice(product, selectedOptions);
  const selectImage = (step) => setActiveImage((index) => (index + step + gallery.length) % gallery.length);

  useEffect(() => () => window.clearTimeout(copiedTimeout.current), []);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    window.clearTimeout(copiedTimeout.current);
    copiedTimeout.current = window.setTimeout(() => setCopied(false), 3000);
  };

  const addSelectedProduct = () => {
    if (isUploadingAttachments) return false;
    if (product.options?.some((option) => !selectedOptions[option.label])) {
      setOptionsError(true);
      return false;
    }
    addItem(product, quantity, selectedOptions, selectedPrice, { note, attachments });
    setAdded(true);
    return true;
  };

  const uploadAttachments = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (attachments.length + files.length > 5) {
      setAttachmentError("يمكن إرفاق 5 ملفات كحد أقصى.");
      return;
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setIsUploadingAttachments(true);
    setAttachmentError("");
    try {
      const response = await request("/orders/attachments", { method: "POST", body: formData, auth: false });
      setAttachments((current) => [...current, ...(response.attachments || [])]);
    } catch (error) {
      setAttachmentError(error.message || "تعذر رفع المرفقات. حاول مرة أخرى.");
    } finally {
      setIsUploadingAttachments(false);
    }
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
          <p className="mt-4 text-xl font-bold text-[#202124]">{product.options?.length > 0 && <span className="ml-1 text-sm font-medium text-gray-500">يبدأ من</span>}<PriceText price={getProductStartingPrice(product)} /></p>

          <div className="mt-7 space-y-3 text-sm leading-7 text-gray-800">
            {visibleDescription.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>)}
            {shouldShowReadMore && !isDescriptionExpanded && <span>…</span>}
            {product.specs?.length > 0 && <div>
              <h2 className="mb-2 font-bold">المواصفات:</h2>
              <ul className="space-y-1.5">
                {product.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2">
                    <Check size={16} className="mt-1 shrink-0 text-[#1D1F1F]" />
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>}
          </div>

          {shouldShowReadMore && (
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
              className="mt-3 cursor-pointer text-sm text-blue-600 hover:text-blue-800"
            >
              {isDescriptionExpanded ? "\u0639\u0631\u0636 \u0623\u0642\u0644" : "\u0627\u0642\u0631\u0623 \u0627\u0644\u0645\u0632\u064a\u062f"}
            </button>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={pendingProductIds.has(product.id)}
              onClick={() => user ? toggleFavorite(product) : router.push("/login")}
              aria-label={isFavorite ? "إزالة من قائمة الأمنيات" : "أضف إلى قائمة الأمنيات"}
              aria-pressed={isFavorite}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-300 transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60 ${isFavorite ? "text-red-600" : "text-gray-600"}`}
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
                    initial={{ opacity: 0, y: 8, scale: 0.9, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: 4, scale: 0.94, x: "-50%" }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg"
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
              <label htmlFor="product-attachment" className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#343838] ${isUploadingAttachments ? "cursor-wait opacity-70" : "cursor-pointer"}`}>
                {isUploadingAttachments ? <LoaderCircle size={16} className="animate-spin text-gray-300" /> : <Link2 size={16} className="text-gray-300" />}
                {isUploadingAttachments ? "جارٍ رفع المرفقات…" : attachments.length ? `المرفقات (${attachments.length}/5)` : "إرفاق ملف"}
              </label>
              <input id="product-attachment" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,application/pdf" disabled={isUploadingAttachments} className="sr-only" onChange={uploadAttachments} />
              <button type="button" onClick={() => setShowNote((value) => !value)} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#343838]">
                <MessageSquare size={16} className="text-gray-300" />
                إضافة ملاحظة
              </button>
            </div>
            <p className="mt-2 text-[10px] text-gray-400">حتى 5 ملفات؛ صور أو PDF، بحد أقصى 5 ميجابايت للملف.</p>
            {showNote && <textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="اكتب ملاحظتك هنا" className="mt-4 min-h-[100px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-200" />}
            {attachmentError && <p role="alert" className="mt-3 text-xs font-medium text-red-600">{attachmentError}</p>}
            {attachments.length > 0 && <ul className="mt-3 space-y-2">{attachments.map((file) => <li key={file.url} className="flex min-w-0 items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600"><FileText size={15} className="shrink-0 text-gray-400" /><span className="min-w-0 flex-1 truncate">{file.name}</span><button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.url !== file.url))} aria-label={`حذف المرفق ${file.name}`} className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button></li>)}</ul>}
          </section>

          <section className="mt-5 rounded-xl bg-white p-5 sm:p-6" aria-label="السعر والشراء">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-gray-700">السعر</span>
              <span className="text-lg font-extrabold text-[#202124]"><PriceText price={selectedPrice} /></span>
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
              <button type="button" disabled={isUploadingAttachments} onClick={() => { if (addSelectedProduct()) router.push("/cart"); }} className="min-h-11 cursor-pointer rounded-full border border-[#1D1F1F] px-4 py-2 text-sm font-bold text-[#1D1F1F] transition-colors hover:bg-[#1D1F1F]/10 disabled:cursor-wait disabled:opacity-60">اشتر الآن</button>
              <button type="button" disabled={isUploadingAttachments} onClick={addSelectedProduct} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#1D1F1F] bg-[#1D1F1F] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#343838] disabled:cursor-wait disabled:opacity-60">
                <ShoppingCart size={16} />{added ? `تمت الإضافة (${quantity})` : "أضف إلى السلة"}
              </button>
            </div>
          </section>
        </section>

        <section className="min-w-0" aria-label="صور المنتج" dir="rtl">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <AnimatePresence mode="sync" initial={false}>
              <motion.img
                key={`${activeImage}-${gallery[activeImage]}`}
                src={gallery[activeImage]}
                alt={product.name}
                draggable={false}
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.995 }}
                transition={{ opacity: { duration: 0.22, ease: "easeInOut" }, scale: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </AnimatePresence>
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
