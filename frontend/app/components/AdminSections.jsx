"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, GripVertical, ImagePlus, LoaderCircle, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getProductImageUrl } from "../lib/productApi";

const emptyForm = { name: "", banner: { src: "", alt: "", link: "" }, sortOrder: 0, isActive: true };
const fieldClass = "mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-500";
const resolvePreview = (src) => src?.startsWith("/uploads/") ? getProductImageUrl(src) : src;

export default function AdminSections() {
  const { request } = useAuth();
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [draggedSectionId, setDraggedSectionId] = useState("");
  const [dragOverSectionId, setDragOverSectionId] = useState("");
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (!bannerPreview.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(bannerPreview);
  }, [bannerPreview]);

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request("/admin/sections");
      setSections(response.sections || []);
    } catch (error) { setNotice(error.message); }
    finally { setLoading(false); }
  }, [request]);
  useEffect(() => { loadSections(); }, [loadSections]);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const resetEditor = () => {
    setForm(emptyForm); setEditingId(null); setBannerFile(null); setBannerPreview(""); setFileInputKey((key) => key + 1);
  };
  const chooseBannerFile = (file) => {
    setBannerFile(file || null);
    setBannerPreview(file ? URL.createObjectURL(file) : resolvePreview(form.banner.src));
  };
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice("");
    try {
      const endpoint = editingId ? `/admin/sections/${editingId}` : "/admin/sections";
      const payload = new FormData();
      payload.append("payload", JSON.stringify(form));
      if (bannerFile) payload.append("bannerImage", bannerFile);
      const response = await request(endpoint, { method: editingId ? "PATCH" : "POST", body: payload });
      setSections((current) => (editingId
        ? current.map((section) => section._id === editingId ? response.section : section)
        : [...current, response.section]).sort((a, b) => a.sortOrder - b.sortOrder));
      resetEditor();
      setNotice(editingId ? "تم تحديث القسم." : "تم إنشاء القسم.");
    } catch (error) { setNotice(error.message); }
    finally { setSaving(false); }
  };
  const startEdit = (section) => {
    setEditingId(section._id);
    setForm({ name: section.name, banner: { src: section.banner?.src || "", alt: section.banner?.alt || "", link: section.banner?.link || "" }, sortOrder: section.sortOrder || 0, isActive: section.isActive });
    setBannerFile(null); setBannerPreview(resolvePreview(section.banner?.src || "")); setFileInputKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (section) => {
    if (!window.confirm(`حذف القسم «${section.name}»؟ ستبقى المنتجات ويمكن إسنادها إلى قسم آخر.`)) return;
    try {
      await request(`/admin/sections/${section._id}`, { method: "DELETE" });
      setSections((current) => current.filter((item) => item._id !== section._id));
      if (editingId === section._id) resetEditor();
    } catch (error) { setNotice(error.message); }
  };
  const dropSectionOn = async (targetId) => {
    const sourceId = draggedSectionId;
    setDraggedSectionId("");
    setDragOverSectionId("");
    if (!sourceId || sourceId === targetId || isReordering) return;

    const previousSections = sections;
    const nextSections = [...sections];
    const sourceIndex = nextSections.findIndex((section) => section._id === sourceId);
    const targetIndex = nextSections.findIndex((section) => section._id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [movedSection] = nextSections.splice(sourceIndex, 1);
    nextSections.splice(targetIndex, 0, movedSection);
    const orderedSections = nextSections.map((section, index) => ({ ...section, sortOrder: index + 1 }));
    setSections(orderedSections);
    setIsReordering(true);
    setNotice("");

    try {
      await Promise.all(orderedSections.map((section) => request(`/admin/sections/${section._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: section.name,
          banner: section.banner || { src: "", alt: "", link: "" },
          sortOrder: section.sortOrder,
          isActive: section.isActive,
        }),
      })));
      setNotice("تم حفظ ترتيب الأقسام.");
    } catch (error) {
      setSections(previousSections);
      setNotice(error.message || "تعذر حفظ ترتيب الأقسام.");
      await loadSections();
    } finally {
      setIsReordering(false);
    }
  };

  return <div className="space-y-6" dir="rtl">
    <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{editingId ? "تعديل القسم" : "إنشاء قسم"}</h2><p className="mt-1 text-sm text-gray-500">أنشئ أقسام المتجر وأضف صورة عريضة تظهر قبل منتجات كل قسم.</p></div>{editingId && <button type="button" onClick={resetEditor} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full hover:bg-gray-100" aria-label="إلغاء التعديل"><X size={18} /></button>}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-gray-700">اسم القسم<input required minLength={2} maxLength={100} value={form.name} onChange={(event) => updateForm("name", event.target.value)} className={fieldClass} placeholder="مثال: الدروع التذكارية" /></label>
        <div className="sm:col-span-2"><label htmlFor="section-banner-image" className="text-sm font-semibold text-gray-700">صورة بانر القسم</label><label htmlFor="section-banner-image" className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:border-gray-500 hover:bg-gray-100"><Upload size={17} /><span className="font-semibold">{bannerFile?.name || (form.banner.src ? "اختيار صورة جديدة" : "رفع صورة")}</span><span className="mr-auto text-xs text-gray-400">JPG أو PNG أو WebP أو AVIF، حتى 5 MB</span></label><input key={fileInputKey} id="section-banner-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => chooseBannerFile(event.target.files?.[0])} className="sr-only" /></div>
        <label className="text-sm font-semibold text-gray-700 sm:col-span-2">الرابط عند الضغط على البانر<input dir="ltr" value={form.banner.link} onChange={(event) => updateForm("banner", { ...form.banner, link: event.target.value })} className={fieldClass} placeholder="/products أو https://example.com" /></label>
        <label className="text-sm font-semibold text-gray-700 sm:col-span-2">النص البديل للصورة<input value={form.banner.alt} onChange={(event) => updateForm("banner", { ...form.banner, alt: event.target.value })} className={fieldClass} /></label>
        {(bannerPreview || form.banner.src) && <img src={bannerPreview || resolvePreview(form.banner.src)} alt={form.banner.alt} className="sm:col-span-2 aspect-[16/6] w-full rounded-xl object-cover" />}
        <div className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-700">القسم ظاهر في المتجر</span><div className="flex items-center gap-3"><button type="button" role="switch" aria-checked={form.isActive} onClick={() => updateForm("isActive", !form.isActive)} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1F1F]/30 focus-visible:ring-offset-2 ${form.isActive ? "bg-emerald-600" : "bg-gray-300"}`}><span className={`grid h-5 w-5 place-items-center rounded-full bg-white text-emerald-700 shadow transition-transform ${form.isActive ? "translate-x-0" : "-translate-x-5"}`}>{form.isActive && <Check size={13} strokeWidth={3} />}</span></button><span className={`text-xs font-semibold leading-none ${form.isActive ? "text-emerald-700" : "text-gray-500"}`}>{form.isActive ? "ظاهر" : "مخفي"}</span></div></div>
      </div>
      <button disabled={saving} type="submit" className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1D1F1F] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{editingId ? <Save size={16} /> : <Plus size={16} />}{saving ? "جارٍ الحفظ…" : editingId ? "حفظ القسم" : "إنشاء القسم"}</button>
    </form>
    {notice && <p role="status" className="fixed left-5 top-5 z-50 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-lg">{notice}</p>}
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">أقسام المتجر</h2>{sections.length > 1 && <p className="text-xs text-gray-400">اسحب المقبض بجانب الصورة لتغيير ترتيب القسم</p>}</div>
      {loading ? <div className="grid min-h-32 place-items-center"><LoaderCircle className="animate-spin" /></div> : sections.length ? <div className="space-y-3 rounded-xl" aria-busy={isReordering}>
        {sections.map((section) => <article key={section._id} onDragOver={(event) => { if (draggedSectionId) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDragOverSectionId(section._id); } }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOverSectionId(""); }} onDrop={(event) => { event.preventDefault(); dropSectionOn(section._id); }} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors ${dragOverSectionId === section._id && draggedSectionId !== section._id ? "border-[#1D1F1F] bg-gray-50 ring-2 ring-[#1D1F1F]/10" : "border-gray-100"} ${draggedSectionId === section._id ? "opacity-45" : ""}`}>
          <button type="button" draggable={!isReordering} aria-label={`اسحب لتغيير ترتيب قسم ${section.name}`} title="اسحب لتغيير الترتيب" onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", section._id); setDraggedSectionId(section._id); }} onDragEnd={() => { setDraggedSectionId(""); setDragOverSectionId(""); }} className={`grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing ${isReordering ? "cursor-wait opacity-50" : ""}`}><GripVertical size={19} /></button>
          {section.banner?.src ? <img src={section.banner.src} alt={section.banner.alt} className="h-16 w-28 rounded-lg object-cover" /> : <span className="grid h-16 w-28 place-items-center rounded-lg bg-gray-50 text-gray-400"><ImagePlus size={20} /></span>}
          <div className="min-w-0 flex-1"><h3 className="font-bold">{section.name}</h3><p className="mt-1 text-xs text-gray-500">{section.isActive ? "ظاهر" : "مخفي"} · الترتيب {section.sortOrder || 0}</p></div>
          <button type="button" onClick={() => startEdit(section)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"><Pencil size={15} />تعديل</button>
          <button type="button" onClick={() => remove(section)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} />حذف</button>
        </article>)}
      </div> : <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">لا توجد أقسام. أنشئ أول قسم ثم اربط المنتجات به.</p>}
    </section>
  </div>;
}
