'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, ShoppingBag, User, X } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

function FieldError({ id, message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div key={id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: EASE }} className="overflow-hidden">
          <p id={id} role="alert" className="pt-2 text-sm text-red-600">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AuthField({ id, label, icon: Icon, error, ltr = false, children }) {
  return (
    <motion.div variants={item} className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-sm font-semibold text-neutral-700">{label}</label>
      <div className="relative">
        <span className={`pointer-events-none absolute inset-y-0 right-4 flex items-center transition-colors ${error ? "text-red-500" : "text-neutral-400"}`}>
          <Icon size={18} />
        </span>
        {children({
          className: `w-full rounded-xl border bg-white py-3.5 pr-11 text-base text-neutral-900 outline-none transition-colors duration-150 focus:ring-2 ${ltr ? "text-right" : ""} ${error ? "border-red-500 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-neutral-300 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-gray-500/10"}`,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : undefined,
          dir: ltr ? "ltr" : undefined,
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </motion.div>
  );
}

export default function AuthPage({ mode, modal = false, onClose, onModeChange }) {
  const isRegister = mode === "register";
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState("");

  useEffect(() => {
    if (!modal) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, onClose]);

  const switchMode = (nextMode) => {
    setErrors({});
    setGlobalMessage("");
    onModeChange?.(nextMode);
  };

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "", ...(field === "password" ? { confirmPassword: "" } : {}) }));
    setGlobalMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (isRegister && !formData.firstName.trim()) nextErrors.firstName = "يرجى إدخال الاسم الأول";
    if (isRegister && !formData.lastName.trim()) nextErrors.lastName = "يرجى إدخال اسم العائلة";
    if (!formData.email.trim()) nextErrors.email = "يرجى إدخال البريد الإلكتروني";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = "يرجى إدخال بريد إلكتروني صحيح";
    if (!formData.password) nextErrors.password = "يرجى إدخال كلمة المرور";
    else if (isRegister && formData.password.length < 8) nextErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    if (isRegister && !formData.confirmPassword) nextErrors.confirmPassword = "يرجى تأكيد كلمة المرور";
    else if (isRegister && formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) setGlobalMessage("خدمة الحسابات غير متاحة حاليًا.");
  };

  const formContent = (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto w-full max-w-md">
          <motion.div variants={item} className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <ShoppingBag size={25} strokeWidth={1.8} />
            </div>
            <h1 className="mb-3 text-3xl font-bold leading-snug text-neutral-900 sm:text-4xl">
              {isRegister ? "أنشئ حسابك في بالميرا" : "أهلاً بعودتك إلى بالميرا"}
            </h1>
            <p className="text-base text-neutral-500">
              {isRegister ? "أنشئ حسابك وابدأ تجربة تسوق مميزة" : "سجّل دخولك للمتابعة"}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {isRegister && (
              <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AuthField id="firstName" label="الاسم الأول" icon={User} error={errors.firstName}>
                  {(props) => <input {...props} id="firstName" type="text" autoComplete="given-name" value={formData.firstName} onChange={updateField("firstName")} placeholder="الاسم الأول" className={`${props.className} pl-4`} />}
                </AuthField>
                <AuthField id="lastName" label="اسم العائلة" icon={User} error={errors.lastName}>
                  {(props) => <input {...props} id="lastName" type="text" autoComplete="family-name" value={formData.lastName} onChange={updateField("lastName")} placeholder="اسم العائلة" className={`${props.className} pl-4`} />}
                </AuthField>
              </motion.div>
            )}

            <AuthField id="email" label="البريد الإلكتروني" icon={Mail} error={errors.email} ltr>
              {(props) => <input {...props} id="email" type="email" autoComplete="email" value={formData.email} onChange={updateField("email")} placeholder="ادخل بريدك الإلكتروني" className={`${props.className} pl-4`} />}
            </AuthField>

            <AuthField id="password" label="كلمة المرور" icon={Lock} error={errors.password}>
              {(props) => (
                <>
                  <input {...props} id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={formData.password} onChange={updateField("password")} placeholder={isRegister ? "8 أحرف على الأقل" : "كلمة المرور"} className={`${props.className} pl-11`} />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute inset-y-0 left-4 flex cursor-pointer items-center text-neutral-400 transition-colors hover:text-neutral-700">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </>
              )}
            </AuthField>

            {isRegister && (
              <AuthField id="confirmPassword" label="تأكيد كلمة المرور" icon={Lock} error={errors.confirmPassword}>
                {(props) => (
                  <>
                    <input {...props} id="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={formData.confirmPassword} onChange={updateField("confirmPassword")} placeholder="أعد إدخال كلمة المرور" className={`${props.className} pl-11`} />
                    <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute inset-y-0 left-4 flex cursor-pointer items-center text-neutral-400 transition-colors hover:text-neutral-700">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </>
                )}
              </AuthField>
            )}

            <AnimatePresence initial={false}>
              {globalMessage && (
                <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
                  {globalMessage}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button variants={item} whileTap={{ scale: 0.98 }} type="submit" className="mt-1 flex w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-neutral-700">
              {isRegister ? "إنشاء الحساب" : "تسجيل الدخول"}
            </motion.button>

            <motion.p variants={item} className="text-center text-sm text-neutral-500">
              {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
              {onModeChange ? (
                <button type="button" onClick={() => switchMode(isRegister ? "login" : "register")} className="cursor-pointer font-semibold text-neutral-900 hover:underline">
                  {isRegister ? "تسجيل الدخول" : "إنشاء حساب"}
                </button>
              ) : (
                <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-neutral-900 hover:underline">
                  {isRegister ? "تسجيل الدخول" : "إنشاء حساب"}
                </Link>
              )}
            </motion.p>
          </form>
    </motion.div>
  );

  if (modal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label={isRegister ? "إنشاء حساب" : "تسجيل الدخول"}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseDown={(event) => event.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 py-8 shadow-2xl sm:px-10"
          dir="rtl"
        >
          <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute left-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
            <X size={19} />
          </button>
          {formContent}
        </motion.section>
      </motion.div>
    );
  }

  return <main dir="rtl" className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-12">{formContent}</main>;
}
