"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ImagePlus, LoaderCircle, Package, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getProductImageUrl, getProductStartingPrice, normalizeProduct } from "../lib/productApi";

const emptyForm = {
  sectionId: "",
  name: "",
  price: "",
  description: "",
  options: [],
  images: Array(5).fill(null),
  isActive: true,
};

const inputClassName = "w-full rounded-xl border bg-white px-4 py-3 text-right text-sm outline-none transition";
const normalizeProductSearch = (value) => String(value || "")
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .toLocaleLowerCase("ar")
  .trim();
const normalizePriceFilterInput = (value) => {
  const digits = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[^\d.]/g, "");
  const decimalPointIndex = digits.indexOf(".");
  return decimalPointIndex === -1
    ? digits
    : `${digits.slice(0, decimalPointIndex + 1)}${digits.slice(decimalPointIndex + 1).replace(/\./g, "")}`;
};

function getInputClassName(hasError) {
  return `${inputClassName} ${hasError
    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
    : "border-gray-200 focus:border-[#1D1F1F] focus:ring-2 focus:ring-[#1D1F1F]/15"}`;
}

const pricingModeLabels = {
  none: "لا يتغير السعر",
  additive: "إضافة على الأساسي",
  fixed: "سعر نهائي",
};

function ProductFilterDropdown({ value, onChange, options, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setIsOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return <div ref={dropdownRef} className="relative min-w-36">
    <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-3 text-right text-xs font-semibold text-gray-700 transition hover:border-gray-400 ${isOpen ? "border-[#1D1F1F] ring-2 ring-[#1D1F1F]/10" : "border-gray-200"}`}>
      <span className="truncate">{selectedOption?.label || label}</span><motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.16 }} className="shrink-0 text-gray-400"><ChevronDown size={14} /></motion.span>
    </button>
    <AnimatePresence initial={false}>{isOpen && <motion.div role="listbox" aria-label={label} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }} className="absolute right-0 top-full z-40 mt-2 max-h-64 w-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-right text-xs transition hover:bg-gray-50 ${value === option.value ? "bg-gray-50 font-bold text-[#1D1F1F]" : "text-gray-600"}`}>
        {option.label}{value === option.value && <Check size={14} className="mr-auto text-emerald-600" />}
      </button>)}
    </motion.div>}</AnimatePresence>
  </div>;
}

function ValuePricingDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative min-w-0">
      <button type="button" aria-haspopup="menu" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className={`flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white px-3 text-right text-xs text-gray-700 outline-none transition ${isOpen ? "border-[#1D1F1F] ring-2 ring-[#1D1F1F]/15" : "border-gray-200 hover:border-gray-400 focus:border-[#1D1F1F] focus:ring-2 focus:ring-[#1D1F1F]/15"}`}>
        <span className="truncate">{pricingModeLabels[value] || pricingModeLabels.none}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }} className="shrink-0 text-gray-500"><ChevronDown size={15} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && <motion.div role="menu" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: "easeOut" }} className="absolute right-0 top-full z-30 mt-2 w-full min-w-44 origin-top overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
          <div className="space-y-1">
            {Object.entries(pricingModeLabels).map(([mode, label]) => (
              <button key={mode} type="button" role="menuitemradio" aria-checked={value === mode} onClick={() => { onChange(mode); setIsOpen(false); }} className={`block w-full cursor-pointer rounded-lg px-3 py-2.5 text-right text-xs outline-none transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#1D1F1F]/20 ${value === mode ? "bg-gray-100 font-semibold text-[#1D1F1F]" : "text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

function SectionDropdown({ sections, value, hasError, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const availableSections = sections.filter((section) => section.isActive || section._id === value);
  const selectedSection = availableSections.find((section) => section._id === value);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return <div ref={dropdownRef} className="relative">
    <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} aria-invalid={hasError} onClick={() => setIsOpen((open) => !open)} className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-4 text-right text-sm outline-none transition focus-visible:ring-2 ${hasError ? "border-red-400 focus-visible:ring-red-100" : isOpen ? "border-[#1D1F1F] ring-2 ring-[#1D1F1F]/15" : "border-gray-200 hover:border-gray-400 focus-visible:border-[#1D1F1F] focus-visible:ring-[#1D1F1F]/15"}`}>
      <span className={selectedSection ? "font-medium text-gray-800" : "text-gray-400"}>{selectedSection?.name || "اختر قسمًا للمنتج"}</span>
      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.18 }} className="shrink-0 text-gray-500"><ChevronDown size={17} /></motion.span>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && <motion.div role="listbox" aria-label="أقسام المتجر" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: "easeOut" }} className="absolute right-0 top-full z-40 mt-2 max-h-64 w-full origin-top overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
        {availableSections.length ? availableSections.map((section) => <button key={section._id} type="button" role="option" aria-selected={value === section._id} onClick={() => { onChange(section._id); setIsOpen(false); }} className={`flex w-full cursor-pointer items-center rounded-lg px-3 py-3 text-right text-sm transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1F1F]/20 ${value === section._id ? "bg-gray-50 font-bold text-[#1D1F1F]" : "text-gray-700"}`}>
          <span>{section.name}</span>{value === section._id && <span className="mr-auto text-xs font-semibold text-emerald-700">محدد</span>}
        </button>) : <p className="px-3 py-3 text-xs text-gray-500">لا توجد أقسام متاحة. أنشئ قسمًا أولًا.</p>}
      </motion.div>}
    </AnimatePresence>
  </div>;
}

function validateProductForm(form, isEditing) {
  const errors = {};

  if (!form.sectionId) errors.sectionId = "يرجى اختيار قسم للمنتج.";

  if (form.name.trim().length < 2) errors.name = "أدخل اسم المنتج، ويجب أن يتكون من حرفين على الأقل.";
  if (!/^\d+(\.\d+)?$/.test(form.price) || !Number.isFinite(Number(form.price))) {
    errors.price = "أدخل السعر بالأرقام فقط.";
  }
  if (!form.description.trim()) errors.description = "أدخل وصف المنتج.";
  if (!isEditing && !form.images[0]) errors.image = "اختر الصورة الرئيسية للمنتج.";

  const hasIncompleteOption = form.options.some((option) => {
    const enteredValues = option.values.filter((value) => value.trim());
    const hasLabel = option.label.trim();
    const hasInvalidPrice = option.values.some((_value, index) => option.valuePricingModes[index] !== "none" && (
      !/^\d+(\.\d+)?$/.test(option.valuePrices[index] ?? "")
      || !Number.isFinite(Number(option.valuePrices[index]))
    ));
    return (hasLabel || enteredValues.length > 0)
      && (!hasLabel || enteredValues.length < 2 || enteredValues.length !== option.values.length || hasInvalidPrice || option.valuePrices.length !== option.values.length);
  });
  if (hasIncompleteOption) errors.options = "أكمل اسم كل قائمة وأضف قيمتين على الأقل، ثم أدخل الأسعار المطلوبة.";
  if (form.options.filter((option) => option.valuePricingModes.includes("fixed")).length > 1) {
    errors.options = "يمكن أن تحتوي قائمة واحدة فقط على قيم ذات سعر نهائي.";
  }
  return errors;
}

function ImagePreview({ file, existingImage, index }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview(existingImage ? getProductImageUrl(existingImage) : "");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, existingImage]);

  if (!preview) {
    return <ImagePlus size={24} className="text-gray-400" />;
  }

  return <img src={preview} alt={`صورة المنتج ${index + 1}`} className="h-full w-full object-cover" />;
}

function ProductForm({ product, sections, onCancel, onSaved }) {
  const { request } = useAuth();
  const [form, setForm] = useState(() => product ? {
    ...emptyForm,
    sectionId: product.section || product.sectionId || "",
    name: product.name,
    price: String(product.price),
    description: product.description,
    isActive: product.isActive !== false,
    options: product.options.map((option) => ({
      ...option,
      values: [...option.values],
      valuePrices: option.values.map((_value, index) => String(option.valuePrices?.[index] ?? 0)),
      valuePricingModes: option.values.map((_value, index) => option.valuePricingModes?.[index] || option.pricingMode || "none"),
    })),
  } : emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };
  const setImage = (index, file) => setForm((current) => {
    const images = [...current.images];
    images[index] = file;
    if (index === 0) setFieldErrors((currentErrors) => ({ ...currentErrors, image: "" }));
    return { ...current, images };
  });

  const handleImagePaste = (event, imageIndex) => {
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const pastedImageItem = clipboardItems.find((item) => item.kind === "file" && item.type.startsWith("image/"));
    const pastedImage = pastedImageItem?.getAsFile();

    if (!pastedImage) return;

    event.preventDefault();
    const imageExtension = pastedImage.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const imageFile = pastedImage.name
      ? pastedImage
      : new File([pastedImage], `product-image-${imageIndex + 1}.${imageExtension}`, { type: pastedImage.type });

    setImage(imageIndex, imageFile);
  };

  const updateOption = (index, field, value) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index
        ? { ...option, [field]: value }
        : option),
    }));
    setFieldErrors((current) => ({ ...current, options: "" }));
  };

  const updateOptionValue = (optionIndex, valueIndex, field, value) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, currentOptionIndex) => {
        if (currentOptionIndex !== optionIndex) return option;

        return {
          ...option,
          [field]: option[field].map((currentValue, currentValueIndex) => (
            currentValueIndex === valueIndex ? value : currentValue
          )),
        };
      }),
    }));
    setFieldErrors((current) => ({ ...current, options: "" }));
  };

  const filterPriceInput = (value) => {
    const numericCharacters = value.replace(/[^\d.]/g, "");
    const decimalPointIndex = numericCharacters.indexOf(".");
    const filteredValue = decimalPointIndex === -1
      ? numericCharacters
      : `${numericCharacters.slice(0, decimalPointIndex + 1)}${numericCharacters.slice(decimalPointIndex + 1).replace(/\./g, "")}`;

    updateField("price", filteredValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const validationErrors = validateProductForm(form, Boolean(product));
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const productOptions = form.options
      .map(({ label, values, valuePrices, valuePricingModes }) => ({
        label: label.trim(),
        values: values.map((value) => value.trim()).filter(Boolean),
        valuePricingModes,
        valuePrices: values.map((_value, index) => Number(valuePrices[index] || 0)),
      }))
      .filter((option) => option.label && option.values.length);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("description", form.description);
    formData.append("sectionId", form.sectionId);
    formData.append("isActive", String(form.isActive));
    formData.append("options", JSON.stringify(productOptions));
    const uploadedImagePositions = [];
    form.images.forEach((image, index) => {
      if (!image) return;
      formData.append("images", image);
      uploadedImagePositions.push(index);
    });
    formData.append("imagePositions", JSON.stringify(uploadedImagePositions));

    setIsSaving(true);
    try {
      const productId = product?.id;
      const savedResponse = await request(
        productId ? `/admin/products/${productId}` : "/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          body: formData,
        },
      );
      onSaved(normalizeProduct(savedResponse.product));
    } catch (error) {
      setErrorMessage(error.message || "تعذر حفظ المنتج.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1D1F1F]">{product ? "تعديل المنتج" : "إضافة منتج جديد"}</h2>
          <p className="mt-1 text-sm text-gray-500">حدد هل يغيّر الاختيار السعر، ويضاف إلى الأساسي، أو يحدد سعراً نهائياً.</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="إغلاق" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gray-500 transition hover:bg-gray-100"><X size={19} /></button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2.5 text-sm font-semibold text-gray-700 sm:col-span-2">
          <span>القسم</span>
          <SectionDropdown sections={sections} value={form.sectionId} hasError={Boolean(fieldErrors.sectionId)} onChange={(sectionId) => updateField("sectionId", sectionId)} />
          {!sections.length && <p className="text-xs font-normal text-amber-700">أنشئ قسماً من تبويب الأقسام قبل إضافة المنتجات.</p>}
          {fieldErrors.sectionId && <p className="text-xs font-medium text-red-600" role="alert">{fieldErrors.sectionId}</p>}
        </div>
        <label className="flex flex-col gap-2.5 text-sm font-semibold text-gray-700">
          <span>اسم المنتج<span aria-hidden="true" className="mr-1 text-red-600">*</span></span>
          <input maxLength={160} value={form.name} onChange={(event) => updateField("name", event.target.value)} className={getInputClassName(fieldErrors.name)} aria-invalid={Boolean(fieldErrors.name)} placeholder="مثال: درع كريستال" />
          {fieldErrors.name && <p className="text-xs font-medium text-red-600" role="alert">{fieldErrors.name}</p>}
        </label>
        <div className="flex flex-col gap-2.5 text-sm font-semibold text-gray-700">
          <label htmlFor="product-price">السعر الأساسي <span aria-hidden="true" className="mr-1 text-red-600">*</span></label>
          <div className="flex items-center" dir="rtl">
            <input type="text" inputMode="decimal" id="product-price" value={form.price} onChange={(event) => filterPriceInput(event.target.value)} className={`${getInputClassName(fieldErrors.price)} h-11 min-w-0 flex-1 rounded-r-xl rounded-l-none border-l-0 py-0 focus:ring-inset relative z-10`} aria-invalid={Boolean(fieldErrors.price)} placeholder="0" dir="ltr" />
            <span aria-hidden="true" className="grid min-h-11 shrink-0 place-items-center rounded-l-xl rounded-r-none border border-r-0 border-gray-200 bg-gray-100 px-4 text-sm font-semibold text-gray-600">ر.س</span>
          </div>
          {fieldErrors.price && <p className="text-xs font-medium text-red-600" role="alert">{fieldErrors.price}</p>}
        </div>
        <label className="flex flex-col gap-2.5 text-sm font-semibold text-gray-700 sm:col-span-2">
          <span>وصف المنتج<span aria-hidden="true" className="mr-1 text-red-600">*</span></span>
          <textarea rows={4} maxLength={10000} value={form.description} onChange={(event) => updateField("description", event.target.value)} className={`${getInputClassName(fieldErrors.description)} min-h-[100px] resize-y`} aria-invalid={Boolean(fieldErrors.description)} placeholder="اكتب وصف المنتج" />
          {fieldErrors.description && <p className="text-xs font-medium text-red-600" role="alert">{fieldErrors.description}</p>}
        </label>
        <div className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-700">المنتج ظاهر في المتجر</span><div className="flex items-center gap-3"><button type="button" role="switch" aria-checked={form.isActive} onClick={() => updateField("isActive", !form.isActive)} className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1F1F]/30 focus-visible:ring-offset-2 ${form.isActive ? "bg-emerald-600" : "bg-gray-300"}`}><span className={`grid h-5 w-5 place-items-center rounded-full bg-white text-emerald-700 shadow transition-transform ${form.isActive ? "translate-x-0" : "-translate-x-5"}`}>{form.isActive && <Check size={13} strokeWidth={3} />}</span></button><span className={`text-xs font-semibold leading-none ${form.isActive ? "text-emerald-700" : "text-gray-500"}`}>{form.isActive ? "ظاهر" : "مخفي"}</span></div></div>
      </div>


      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-bold text-gray-800">صور المنتج</legend>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(220px,1fr)]">
          <label tabIndex={0} aria-label="الصق الصورة الرئيسية هنا" onPaste={(event) => handleImagePaste(event, 0)} className={`group relative grid h-52 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed bg-[#FAFAF8] transition focus:outline-none focus:ring-2 focus:ring-[#1D1F1F]/20 sm:h-[220px] ${fieldErrors.image ? "border-red-400" : "border-gray-300 hover:border-[#1D1F1F]"}`}>
            <ImagePreview file={form.images[0]} existingImage={product?.images[0]} index={0} />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setImage(0, event.target.files?.[0] || null)} className="sr-only" aria-invalid={Boolean(fieldErrors.image)} />
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700"><span>الصورة الرئيسية</span><span aria-hidden="true" className="text-base leading-none text-red-600">*</span></span>
            {form.images[0] && <span className="absolute inset-x-2 bottom-2 truncate rounded-lg bg-black/65 px-3 py-2 text-center text-xs text-white">{form.images[0].name}</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {form.images.slice(1).map((image, slotIndex) => {
              const index = slotIndex + 1;
              const existingImage = product?.images[index];
              return (
                <label key={index} tabIndex={0} aria-label={`الصق الصورة ${index + 1} هنا`} onPaste={(event) => handleImagePaste(event, index)} className="group relative grid h-[102px] min-w-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-[#FAFAF8] transition hover:border-[#1D1F1F] focus:outline-none focus:ring-2 focus:ring-[#1D1F1F]/20">
                  <ImagePreview file={image} existingImage={existingImage} index={index} />
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setImage(index, event.target.files?.[0] || null)} className="sr-only" />
                  {image && <span className="absolute inset-x-1 bottom-1 truncate rounded-lg bg-black/65 px-2 py-1 text-center text-[10px] text-white">{image.name}</span>}
                </label>
              );
            })}
          </div>
        </div>
        {product && <p className="mt-2 text-xs text-gray-500">عند اختيار صور جديدة سيتم استبدال صور المنتج الحالية.</p>}
      {fieldErrors.image && <p className="-mt-4 mb-5 text-xs font-medium text-red-600">{fieldErrors.image}</p>}
      </fieldset>

      <section className="mt-7 rounded-2xl bg-[#FAFAF8] p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-800">خيارات المنتج المنسدلة</h3>
            <p className="mt-1 text-xs text-gray-500">حدد طريقة التسعير لكل قيمة بشكل مستقل، ثم أدخل سعرها عند الحاجة.</p>
          </div>
          <button type="button" onClick={() => updateField("options", [...form.options, { label: "", values: ["", ""], valuePrices: ["0", "0"], valuePricingModes: ["none", "none"] }])} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#1D1F1F] transition hover:bg-[#F3F4F6]"><Plus size={15} />إضافة قائمة</button>
        </div>
        <div className="space-y-3">
          {form.options.map((option, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <div className="space-y-2">
                <input value={option.label} onChange={(event) => updateOption(index, "label", event.target.value)} className={getInputClassName(Boolean(fieldErrors.options))} placeholder="اسم القائمة، مثل المقاس" aria-label="اسم القائمة" />
              </div>
              <div className="space-y-2">
                {option.values.map((value, valueIndex) => (
                  <div key={valueIndex} className={`grid items-center gap-2 ${option.valuePricingModes[valueIndex] === "none" ? "grid-cols-[minmax(0,1fr)_minmax(170px,0.8fr)_auto]" : "grid-cols-[minmax(0,1fr)_minmax(170px,0.8fr)_minmax(110px,0.55fr)_auto]"}`}>
                    <input value={value} onChange={(event) => updateOptionValue(index, valueIndex, "values", event.target.value)} className={getInputClassName(Boolean(fieldErrors.options))} placeholder={`القيمة ${valueIndex + 1}`} aria-label={`قيمة ${valueIndex + 1}`} />
                    <ValuePricingDropdown value={option.valuePricingModes[valueIndex] || "none"} onChange={(mode) => updateOptionValue(index, valueIndex, "valuePricingModes", mode)} />
                    {option.valuePricingModes[valueIndex] !== "none" && <div className="relative">
                      <input type="text" inputMode="decimal" value={option.valuePrices[valueIndex] ?? "0"} onChange={(event) => updateOptionValue(index, valueIndex, "valuePrices", event.target.value.replace(/[^\d.]/g, ""))} className={`${getInputClassName(Boolean(fieldErrors.options))} pl-10`} placeholder="0" aria-label={`${option.valuePricingModes[valueIndex] === "fixed" ? "السعر النهائي" : "السعر الإضافي"} للقيمة ${valueIndex + 1}`} dir="ltr" />
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ر.س</span>
                    </div>}
                    {option.values.length > 1 && <button type="button" onClick={() => {
                      updateOption(index, "values", option.values.filter((_, currentIndex) => currentIndex !== valueIndex));
                      updateOption(index, "valuePrices", option.valuePrices.filter((_, currentIndex) => currentIndex !== valueIndex));
                      updateOption(index, "valuePricingModes", option.valuePricingModes.filter((_, currentIndex) => currentIndex !== valueIndex));
                    }} aria-label="حذف القيمة" className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"><X size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => {
                  updateOption(index, "values", [...option.values, ""]);
                  updateOption(index, "valuePrices", [...option.valuePrices, "0"]);
                  updateOption(index, "valuePricingModes", [...option.valuePricingModes, "none"]);
                }} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#1D1F1F] transition hover:bg-gray-100"><Plus size={14} />إضافة قيمة</button>
              </div>
              <button type="button" onClick={() => updateField("options", form.options.filter((_, optionIndex) => optionIndex !== index))} aria-label="حذف القائمة" className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
            </div>
          ))}
          {form.options.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">لا توجد قوائم خيارات لهذا المنتج.</p>}
        </div>
      </section>

      {fieldErrors.options && <p className="mt-3 text-xs font-medium text-red-600">{fieldErrors.options}</p>}
      {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={isSaving} type="submit" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1D1F1F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#343737] disabled:cursor-wait disabled:opacity-60">{isSaving && <LoaderCircle size={16} className="animate-spin" />}{product ? "حفظ التعديلات" : "إضافة المنتج"}</button>
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">إلغاء</button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const { request } = useAuth();
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await request("/admin/products");
      setProducts((response.products || []).map(normalizeProduct));
    } catch (error) {
      setErrorMessage(error.message || "تعذر تحميل المنتجات.");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => {
    request("/admin/sections").then((response) => setSections(response.sections || [])).catch((error) => setErrorMessage(error.message));
  }, [request]);

  const filteredProducts = useMemo(() => {
    const query = normalizeProductSearch(searchQuery);
    const minimum = minPrice === "" ? null : Number(minPrice);
    const maximum = maxPrice === "" ? null : Number(maxPrice);
    return products.filter((product) => {
      const price = getProductStartingPrice(product);
      const sectionId = String(product.section || product.sectionId || "");
      if (sectionFilter !== "all" && sectionId !== sectionFilter) return false;
      if (availabilityFilter === "active" && product.isActive === false) return false;
      if (availabilityFilter === "inactive" && product.isActive !== false) return false;
      if (minimum !== null && Number.isFinite(minimum) && price < minimum) return false;
      if (maximum !== null && Number.isFinite(maximum) && price > maximum) return false;
      if (!query) return true;
      const searchableValues = [product.name];
      return searchableValues.some((value) => normalizeProductSearch(value).includes(query));
    }).sort((first, second) => {
      if (sortOrder === "price-low") return getProductStartingPrice(first) - getProductStartingPrice(second);
      if (sortOrder === "price-high") return getProductStartingPrice(second) - getProductStartingPrice(first);
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  }, [products, searchQuery, sectionFilter, availabilityFilter, minPrice, maxPrice, sortOrder]);

  const hasActiveFilters = searchQuery || sectionFilter !== "all" || availabilityFilter !== "all" || minPrice !== "" || maxPrice !== "" || sortOrder !== "newest";
  const clearFilters = () => {
    setSearchQuery("");
    setSectionFilter("all");
    setAvailabilityFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setSortOrder("newest");
  };

  const handleSaved = (savedProduct) => {
    setProducts((current) => {
      const alreadyExists = current.some((product) => product.id === savedProduct.id);
      return alreadyExists
        ? current.map((product) => product.id === savedProduct.id ? savedProduct : product)
        : [savedProduct, ...current];
    });
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`هل تريد حذف المنتج «${product.name}»؟`)) return;
    setDeletingId(product.id);
    setErrorMessage("");
    try {
      await request(`/admin/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((candidate) => candidate.id !== product.id));
    } catch (error) {
      setErrorMessage(error.message || "تعذر حذف المنتج.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{new Intl.NumberFormat("ar-SA").format(products.length)} منتج</p>
        {!isCreating && !editingProduct && <button type="button" onClick={() => setIsCreating(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1D1F1F] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#343737]"><Plus size={17} />إضافة منتج</button>}
      </div>

      {(isCreating || editingProduct) && <div className="mb-6"><ProductForm key={editingProduct?.id || "new-product"} product={editingProduct} sections={sections} onCancel={() => { setIsCreating(false); setEditingProduct(null); }} onSaved={handleSaved} /></div>}
      {errorMessage && <p role="alert" className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>}

      {!isLoading && products.length > 0 && <div className="mb-5 space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <label className="relative block">
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="ابحث باسم المنتج..." aria-label="ابحث باسم المنتج" className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50/70 pr-11 pl-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-900/5" />
        </label>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500"><SlidersHorizontal size={14} />تصفية</span>
          <ProductFilterDropdown label="القسم" value={sectionFilter} onChange={setSectionFilter} options={[{ value: "all", label: "كل الأقسام" }, ...sections.map((section) => ({ value: String(section._id), label: section.name }))]} />
          <ProductFilterDropdown label="التوفر" value={availabilityFilter} onChange={setAvailabilityFilter} options={[{ value: "all", label: "كل المنتجات" }, { value: "active", label: "متاح في المتجر" }, { value: "inactive", label: "غير متاح" }]} />
          <ProductFilterDropdown label="الترتيب" value={sortOrder} onChange={setSortOrder} options={[{ value: "newest", label: "الأحدث أولًا" }, { value: "price-low", label: "السعر: من الأقل" }, { value: "price-high", label: "السعر: من الأعلى" }]} />
          <div className="flex min-h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5">
            <span className="shrink-0 text-[11px] font-semibold text-gray-500">السعر</span>
            <input type="text" inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(normalizePriceFilterInput(event.target.value))} aria-label="أقل سعر" placeholder="من" className="h-8 w-16 rounded-lg bg-gray-50 px-2 text-center text-xs text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10" />
            <span className="text-gray-300">–</span>
            <input type="text" inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(normalizePriceFilterInput(event.target.value))} aria-label="أعلى سعر" placeholder="إلى" className="h-8 w-16 rounded-lg bg-gray-50 px-2 text-center text-xs text-gray-700 outline-none focus:ring-2 focus:ring-gray-900/10" />
            <span className="shrink-0 text-[10px] text-gray-400">ر.س</span>
          </div>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"><X size={14} />مسح الفلاتر</button>}
        </div>
        <p className="text-xs text-gray-500">عرض <span className="font-bold text-gray-700">{new Intl.NumberFormat("ar-SA").format(filteredProducts.length)}</span> من {new Intl.NumberFormat("ar-SA").format(products.length)} منتج</p>
      </div>}

      {isLoading ? (
        <div className="grid min-h-48 place-items-center rounded-2xl border border-gray-100 bg-white text-sm text-gray-500"><LoaderCircle size={18} className="animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="grid min-h-64 place-items-center rounded-3xl border border-gray-100 bg-white px-6 text-center shadow-sm"><div><span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#F3F4F6] text-[#1D1F1F]"><Package size={24} /></span><h2 className="font-bold text-[#1D1F1F]">لا توجد منتجات حتى الآن</h2><p className="mt-2 text-sm text-gray-500">أضف أول منتج ليظهر في واجهة المتجر.</p></div></div>
      ) : filteredProducts.length === 0 ? (
        <div className="grid min-h-56 place-items-center rounded-3xl border border-dashed border-gray-200 bg-white px-6 text-center"><div><Search size={26} className="mx-auto text-gray-300" /><h2 className="mt-3 text-sm font-bold text-gray-700">لا توجد منتجات مطابقة</h2><p className="mt-1 text-xs text-gray-500">غيّر البحث أو الفلاتر ثم حاول مرة أخرى.</p><button type="button" onClick={clearFilters} className="mt-3 cursor-pointer text-xs font-bold text-gray-800 underline underline-offset-4">مسح البحث والفلاتر</button></div></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-[#FAFAF8]"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-[#1D1F1F]">{product.name}</h3><span className="shrink-0 text-sm font-bold text-emerald-700">{product.options.length > 0 ? "يبدأ من " : ""}{new Intl.NumberFormat("ar-SA").format(getProductStartingPrice(product))} ر.س</span></div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">{product.description}</p>
                {product.options.length > 0 && <p className="mt-3 text-xs text-gray-500">القوائم: {product.options.map((option) => option.label).join("، ")}</p>}
                <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                  <button type="button" onClick={() => { setIsCreating(false); setEditingProduct(product); }} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-100"><Pencil size={15} />تعديل</button>
                  <button type="button" disabled={deletingId === product.id} onClick={() => handleDelete(product)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={15} />{deletingId === product.id ? "جارٍ الحذف" : "حذف"}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
