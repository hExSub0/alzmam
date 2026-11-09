"use client";

import { useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import { useAuth } from "./AuthProvider";

const initialBanners = [
  { src: "/images/banner-1.webp", alt: "دروع وهدايا الزمام" },
  { src: "/images/banner-2.webp", alt: "هدايا دعائية من الزمام" },
  { src: "/images/banner-3.webp", alt: "منتجات الزمام" },
];
const fieldClass = "mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-500";

export default function AdminBanners() {
  const { request } = useAuth();
  const [banners, setBanners] = useState(initialBanners);
  const [savedBanners, setSavedBanners] = useState(initialBanners);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const isDirty = JSON.stringify(banners) !== JSON.stringify(savedBanners);

  useEffect(() => {
    request("/banners", { auth: false }).then(({ banners: current }) => {
      if (Array.isArray(current)) { setBanners(current); setSavedBanners(current); }
    }).catch((error) => setToast({ type: "error", text: error.message })).finally(() => setLoading(false));
  }, [request]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const save = async () => {
    setSaving(true); setToast(null);
    try {
      const result = await request("/admin/banners", {
        method: "PUT", body: JSON.stringify({ banners }),
      });
      setBanners(result.banners);
      setSavedBanners(result.banners);
      setToast({ type: "success", text: "تم حفظ صور البانر بنجاح" });
    } catch (error) { setToast({ type: "error", text: error.message }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid min-h-48 place-items-center rounded-2xl bg-white"><LoaderCircle className="animate-spin" /></div>;

  return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7" dir="rtl">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-bold">صور البانر الرئيسي</h2><p className="mt-1 text-sm text-gray-500">أضف رابط صورة HTTPS أو مسار صورة من المتجر، وسيظهر ترتيبها في العرض.</p></div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setBanners((current) => [...current, { src: "", alt: "" }])} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold"><ImagePlus size={17} /> إضافة صورة</button>
        <button type="button" disabled={!isDirty || saving} onClick={save} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300"><Save size={16} />{saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}</button>
      </div>
    </div>
    <div className="space-y-4">
      {banners.map((banner, index) => <div key={index} className="grid gap-3 rounded-xl border border-gray-100 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-semibold text-gray-600">رابط الصورة<input className={fieldClass} dir="ltr" value={banner.src} onChange={(event) => setBanners((current) => current.map((item, i) => i === index ? { ...item, src: event.target.value } : item))} placeholder="/images/banner.webp أو https://…" /></label>
        <label className="text-xs font-semibold text-gray-600">النص البديل<input className={fieldClass} value={banner.alt} onChange={(event) => setBanners((current) => current.map((item, i) => i === index ? { ...item, alt: event.target.value } : item))} /></label>
        <button type="button" aria-label="حذف الصورة" onClick={() => setBanners((current) => current.filter((_, i) => i !== index))} className="grid h-11 w-11 cursor-pointer place-items-center rounded-xl text-red-600 hover:bg-red-50"><Trash2 size={18} /></button>
        {banner.src && <img src={banner.src} alt={banner.alt} className="col-span-full aspect-[16/5] w-full rounded-lg object-cover" />}
      </div>)}
    </div>
    {toast && <div role={toast.type === "error" ? "alert" : "status"} className={`fixed left-5 top-5 z-50 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${toast.type === "error" ? "bg-red-700" : "bg-emerald-700"}`}>{toast.text}</div>}
  </section>;
}
