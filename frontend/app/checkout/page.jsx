"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CheckCircle2, ChevronDown, FileText, LoaderCircle, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import TopHeader from "../components/TopHeader";
import AuthPage from "../components/AuthPage";
import { useAuth } from "../components/AuthProvider";
import { formatCurrency, useCart } from "../components/CartProvider";
import { getProductImageUrl } from "../lib/productApi";

const inputClassName = "mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-gray-900/5";
const normalizePhoneDigits = (value) => value
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .replace(/[^0-9]/g, "");
const SA_CITIES = [
  "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الظهران", "القطيف", "الأحساء", "الهفوف", "المبرز", "الجبيل", "الخفجي", "حفر الباطن", "النعيرية", "بقيق", "رأس تنورة",
  "الطائف", "تبوك", "ينبع", "العلا", "أملج", "الوجه", "ضباء", "حقل", "تيماء", "بدر", "رابغ", "القنفذة", "الليث", "خليص", "الكامل", "الجموم",
  "أبها", "خميس مشيط", "بيشة", "النماص", "محايل عسير", "ظهران الجنوب", "سراة عبيدة", "جازان", "صبيا", "أبو عريش", "صامطة", "بيش", "الدرب", "فرسان", "نجران", "شرورة", "حبونا", "الباحة", "بلجرشي", "المندق", "العقيق",
  "بريدة", "عنيزة", "الرس", "المذنب", "البكيرية", "رياض الخبراء", "عقلة الصقور", "حائل", "بقعاء", "الشنان", "الغزالة", "عرعر", "رفحاء", "طريف", "سكاكا", "القريات", "دومة الجندل",
  "الخرج", "الدوادمي", "المجمعة", "الزلفي", "شقراء", "وادي الدواسر", "الأفلاج", "القويعية", "عفيف", "حوطة بني تميم", "السليل", "ضرما", "المزاحمية", "رماح", "ثادق", "حريملاء", "الدرعية", "مرات",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isReady: authReady, request } = useAuth();
  const { items, total, ready: cartReady, clearCart } = useCart();
  const [authMode, setAuthMode] = useState(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", city: "", address: "" });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);
  const [citySearch, setCitySearch] = useState("");
  const [isCityListOpen, setIsCityListOpen] = useState(false);
  const cityPickerRef = useRef(null);
  const phoneIsValid = /^5\d{8}$/.test(customer.phone);
  const phoneHasError = Boolean(fieldErrors.phone) || (phoneTouched && !phoneIsValid);
  const filteredCities = SA_CITIES.filter((city) => city.includes(citySearch.trim())).slice(0, 30);
  const submitSteps = ["التحقق من تفاصيل الطلب", "حفظ طلبك بأمان", "تجهيز تأكيد الطلب"];

  useEffect(() => {
    if (!isSubmitting) return undefined;
    const timer = window.setInterval(() => setSubmitPhase((phase) => Math.min(phase + 1, submitSteps.length - 1)), 700);
    return () => window.clearInterval(timer);
  }, [isSubmitting, submitSteps.length]);

  useEffect(() => {
    if (authReady && !user) setAuthMode("login");
  }, [authReady, user]);

  useEffect(() => {
    if (user) {
      setCustomer((current) => ({ ...current, name: current.name || user.name || "", email: current.email || user.email || "" }));
    }
  }, [user]);

  useEffect(() => {
    if (!isCityListOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!cityPickerRef.current?.contains(event.target)) setIsCityListOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isCityListOpen]);

  const updateCustomer = (field) => (event) => {
    setCustomer((current) => ({ ...current, [field]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateCustomer = () => {
    const errors = {};
    if (customer.name.trim().length < 2) errors.name = "أدخل الاسم الكامل (حرفان على الأقل).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) errors.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
    if (!phoneIsValid) errors.phone = "يرجى إدخال رقم جوال صحيح.";
    if (!customer.city.trim()) errors.city = "اختر مدينة من القائمة.";
    if (customer.address.trim().length < 5) errors.address = "أدخل عنوانًا من 5 أحرف على الأقل.";
    return errors;
  };

  const fieldClass = (field) => `${inputClassName} ${fieldErrors[field] ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-gray-200 focus:border-gray-500"}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || !items.length) return;
    const errors = validateCustomer();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setErrorMessage("يرجى مراجعة الحقول المحددة.");
      setIsCityListOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitPhase(0);
    setErrorMessage("");
    const submittedAt = Date.now();
    try {
      const response = await request("/orders", {
        method: "POST",
        body: JSON.stringify({
          customer: { ...customer, phone: `+966${customer.phone}` },
          paymentMethod: "cash_on_delivery",
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            options: item.options || {},
            note: item.note || "",
            attachments: item.attachments || [],
          })),
        }),
      });
      const remainingAnimationTime = Math.max(0, 1500 - (Date.now() - submittedAt));
      if (remainingAnimationTime) await new Promise((resolve) => window.setTimeout(resolve, remainingAnimationTime));
      setCompletedOrder(response.order);
      clearCart();
    } catch (error) {
      setErrorMessage(error.message || "تعذر إتمام الطلب. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <TopHeader />
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6" dir="rtl">
        {completedOrder ? (
          <section className="mx-auto my-auto w-full max-w-xl rounded-2xl bg-white px-6 py-14 text-center shadow-sm">
            <CheckCircle2 size={52} className="mx-auto text-green-600" />
            <h1 className="mt-5 text-2xl font-bold text-gray-900">تم استلام طلبك</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">رقم الطلب: <span dir="ltr">{String(completedOrder._id).slice(-8).toUpperCase()}</span>. سيتم الدفع عند الاستلام.</p>
            <Link href="/account/orders" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1D1F1F] px-6 text-sm font-bold text-white hover:bg-[#343838]">عرض طلباتي</Link>
          </section>
        ) : !cartReady || !authReady ? (
          <div className="grid min-h-64 place-items-center rounded-xl bg-white text-sm text-gray-500"><LoaderCircle size={22} className="animate-spin" /></div>
        ) : !user ? (
          <section className="grid min-h-64 place-items-center rounded-xl bg-white px-5 text-center">
            <div><ShoppingBag size={34} className="mx-auto text-gray-400" /><p className="mt-4 text-sm text-gray-600">سجّل الدخول للمتابعة وإتمام طلبك.</p></div>
          </section>
        ) : items.length === 0 ? (
          <section className="grid min-h-64 place-items-center rounded-xl bg-white px-5 text-center">
            <div><ShoppingBag size={34} className="mx-auto text-gray-400" /><p className="mt-4 text-sm text-gray-600">سلتك فارغة.</p><Link href="/products" className="mt-4 inline-flex text-sm font-semibold text-gray-900 underline">تصفح المنتجات</Link></div>
          </section>
        ) : (
          <>
            <h1 className="mb-7 text-2xl font-bold text-gray-900">إتمام الطلب</h1>
            <form noValidate onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
                <h2 className="text-lg font-bold text-gray-900">بيانات التوصيل</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-gray-700">الاسم الكامل<input maxLength={120} autoComplete="name" value={customer.name} onChange={updateCustomer("name")} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "error-name" : undefined} className={fieldClass("name")} />{fieldErrors.name && <span id="error-name" className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.name}</span>}</label>
                  <label className="text-sm font-semibold text-gray-700">البريد الإلكتروني<input type="email" autoComplete="email" value={customer.email} onChange={updateCustomer("email")} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "error-email" : undefined} className={fieldClass("email")} dir="ltr" />{fieldErrors.email && <span id="error-email" className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.email}</span>}</label>
                  <label className="text-sm font-semibold text-gray-700">رقم الجوال<div className={`mt-2 flex min-h-12 items-stretch overflow-hidden rounded-xl border bg-white transition ${phoneIsValid ? "border-emerald-500" : phoneHasError ? "border-red-500" : "border-gray-200"}`} dir="ltr"><span className={`inline-flex shrink-0 items-center border-r px-4 text-sm font-semibold ${phoneIsValid ? "border-emerald-200 bg-emerald-50 text-gray-600" : phoneHasError ? "border-red-200 bg-red-50 text-gray-600" : "border-gray-200 bg-gray-50 text-gray-600"}`}>+966</span><input type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={15} value={customer.phone} onChange={(event) => { let digits = normalizePhoneDigits(event.target.value); if (digits.startsWith("966")) digits = digits.slice(3); if (digits.startsWith("0")) digits = digits.slice(1); digits = digits.slice(0, 9); setCustomer((current) => ({ ...current, phone: digits })); setFieldErrors((current) => ({ ...current, phone: /^5\d{8}$/.test(digits) ? "" : "يرجى إدخال رقم جوال صحيح." })); }} onBlur={() => { setPhoneTouched(true); setFieldErrors((current) => ({ ...current, phone: phoneIsValid ? "" : "يرجى إدخال رقم جوال صحيح." })); }} aria-invalid={phoneHasError} aria-describedby={phoneHasError ? "error-phone" : undefined} className="min-w-0 flex-1 border-0 bg-transparent px-4 text-sm text-gray-900 outline-none transition" /></div>{phoneHasError && <span id="error-phone" className="mt-1 block text-xs font-normal text-red-600">يرجى إدخال رقم جوال صحيح.</span>}</label>
                  <div ref={cityPickerRef} className="relative text-sm font-semibold text-gray-700">
                    <label htmlFor="checkout-city">المدينة</label>
                    <input id="checkout-city" maxLength={100} autoComplete="address-level2" role="combobox" aria-invalid={Boolean(fieldErrors.city)} aria-expanded={isCityListOpen} aria-controls="sa-city-options" aria-autocomplete="list" value={citySearch || customer.city} onFocus={() => setIsCityListOpen(true)} onChange={(event) => { setCitySearch(event.target.value); setCustomer((current) => ({ ...current, city: "" })); setFieldErrors((current) => ({ ...current, city: "" })); setIsCityListOpen(true); }} onKeyDown={(event) => { if (event.key === "Escape") setIsCityListOpen(false); if (event.key === "Enter" && filteredCities.length) { event.preventDefault(); const city = filteredCities[0]; setCustomer((current) => ({ ...current, city })); setFieldErrors((current) => ({ ...current, city: "" })); setCitySearch(""); setIsCityListOpen(false); } }} className={`${fieldClass("city")} pl-11`} placeholder="ابحث عن مدينتك" />
                    <ChevronDown aria-hidden="true" size={18} className={`pointer-events-none absolute left-4 top-[52px] -translate-y-1/2 text-gray-500 transition-transform duration-200 ${isCityListOpen ? "rotate-180" : ""}`} />
                    {fieldErrors.city && <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.city}</span>}
                    {isCityListOpen && <ul id="sa-city-options" role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
                      {filteredCities.length ? filteredCities.map((city) => <li key={city} role="option" aria-selected={customer.city === city}><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setCustomer((current) => ({ ...current, city })); setFieldErrors((current) => ({ ...current, city: "" })); setCitySearch(""); setIsCityListOpen(false); }} className="w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-sm font-normal text-gray-700 hover:bg-gray-100">{city}</button></li>) : <li className="px-3 py-2.5 text-sm font-normal text-gray-500">لا توجد مدينة مطابقة</li>}
                    </ul>}
                    {customer.city && <input type="hidden" name="city" value={customer.city} />}
                  </div>
                  <label className="text-sm font-semibold text-gray-700 sm:col-span-2">العنوان بالتفصيل<textarea maxLength={500} autoComplete="street-address" rows={3} value={customer.address} onChange={updateCustomer("address")} aria-invalid={Boolean(fieldErrors.address)} className={`${fieldClass("address")} py-3`} />{fieldErrors.address && <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors.address}</span>}</label>
                </div>
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">طريقة الدفع</p>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm font-semibold text-gray-800">
                    <Truck size={20} className="shrink-0 text-emerald-700" />
                    <span>الدفع عند الاستلام</span>
                    <Check size={18} className="mr-auto text-emerald-700" />
                  </div>
                </div>
              </section>
              <aside className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">ملخص الطلب</h2>
                <div className="mt-5 max-h-72 space-y-4 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-4 text-sm">
                      <div className="min-w-0"><p className="font-medium text-gray-800">{item.name}</p><p className="mt-1 text-xs text-gray-500">الكمية: {item.quantity}</p>{item.note && <p className="mt-1 line-clamp-2 text-xs text-gray-500">ملاحظتك: {item.note}</p>}{item.attachments?.length > 0 && <div className="mt-1 space-y-1">{item.attachments.map((attachment) => <a key={attachment.url} href={getProductImageUrl(attachment.url)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-1 text-[10px] text-gray-500 hover:text-gray-900"><FileText size={12} className="shrink-0" /><span className="truncate">{attachment.name}</span></a>)}</div>}</div>
                      <span className="shrink-0 font-semibold text-gray-800">{item.unitPrice == null ? item.price : formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="my-5 h-px bg-gray-100" />
                <div className="flex justify-between gap-3 font-bold text-gray-900"><span>الإجمالي</span><span className="text-green-700">{formatCurrency(total)}</span></div>
                {errorMessage && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
                <button type="submit" disabled={isSubmitting} className="mt-6 min-h-12 w-full rounded-full bg-[#1D1F1F] px-5 text-sm font-bold text-white transition-colors hover:bg-[#343838] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? "جارٍ إرسال الطلب…" : "تأكيد الطلب"}</button>
                <Link href="/cart" className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-900">العودة إلى السلة</Link>
              </aside>
            </form>
          </>
        )}
      </main>
      <Footer className="mt-0" />
      <AnimatePresence>
        {isSubmitting && <motion.div className="fixed inset-0 z-[100] grid place-items-center bg-[#111827]/45 px-4 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} role="status" aria-live="polite" aria-label="جارٍ تأكيد الطلب">
          <motion.section className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-9" dir="rtl" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
            <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#F3F4F6] text-[#1D1F1F]">
              <motion.span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1D1F1F]" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
              <PackageCheck size={31} strokeWidth={1.7} />
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-900">لحظات ونكمل طلبك</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">نراجع تفاصيل الطلب ونحفظه بأمان. يرجى إبقاء الصفحة مفتوحة.</p>
            <div className="mt-7 space-y-3 text-right">
              {submitSteps.map((step, index) => <motion.div key={step} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${index <= submitPhase ? "bg-gray-50 text-gray-900" : "text-gray-400"}`} animate={{ opacity: index <= submitPhase ? 1 : 0.55 }}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${index < submitPhase ? "bg-emerald-100 text-emerald-700" : index === submitPhase ? "bg-[#1D1F1F] text-white" : "bg-gray-100 text-gray-400"}`}>
                  {index < submitPhase ? <Check size={15} /> : index === submitPhase ? <LoaderCircle size={15} className="animate-spin" /> : <span className="text-xs">{index + 1}</span>}
                </span>
                <span className={index === submitPhase ? "font-semibold" : "font-medium"}>{step}</span>
                {index === submitPhase && <motion.span className="mr-auto flex gap-1" aria-hidden="true">{[0, 1, 2].map((dot) => <motion.i key={dot} className="h-1 w-1 rounded-full bg-gray-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }} />)}</motion.span>}
              </motion.div>)}
            </div>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-gray-100"><motion.div className="h-full rounded-full bg-emerald-600" initial={{ width: "8%" }} animate={{ width: `${((submitPhase + 1) / submitSteps.length) * 100}%` }} transition={{ duration: 0.65, ease: "easeInOut" }} /></div>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <AnimatePresence>
        {authMode && (
          <AuthPage mode={authMode} modal onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />
        )}
      </AnimatePresence>
    </div>
  );
}
