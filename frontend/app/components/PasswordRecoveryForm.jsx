"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "./AuthProvider";

const PASSWORD_RULES = [
  { label: "8 أحرف على الأقل", test: (value) => value.length >= 8 },
  { label: "حرف إنجليزي كبير", test: (value) => /[A-Z]/.test(value) },
  { label: "حرف إنجليزي صغير", test: (value) => /[a-z]/.test(value) },
  { label: "رقم واحد على الأقل", test: (value) => /[0-9]/.test(value) },
  { label: "رمز خاص واحد على الأقل", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function PasswordRecoveryForm({ mode, token = "" }) {
  const isReset = mode === "reset";
  const { requestPasswordReset, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (isReset) {
      if (PASSWORD_RULES.some((rule) => !rule.test(password))) {
        setErrorMessage("كلمة المرور لا تستوفي المتطلبات الموضحة.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("كلمتا المرور غير متطابقتين.");
        return;
      }
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage("أدخل بريدًا إلكترونيًا صحيحًا.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isReset) {
        await resetPassword({ token, password });
        setIsComplete(true);
        setMessage("تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول.");
      } else {
        await requestPasswordReset({ email: email.trim().toLowerCase() });
        setIsComplete(true);
        setMessage("إذا كان البريد مسجلًا لدينا، فستصلك رسالة تتضمن رابط إعادة التعيين.");
      }
    } catch (error) {
      setErrorMessage(error.message || "تعذر إكمال الطلب. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasToken = /^[a-f0-9]{64}$/i.test(token);

  return (
    <main dir="rtl" className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
        <h1 className="text-center text-2xl font-bold text-neutral-900">
          {isReset ? "إعادة تعيين كلمة المرور" : "نسيت كلمة المرور؟"}
        </h1>
        <p className="mt-3 text-center text-sm leading-7 text-neutral-500">
          {isReset
            ? "أنشئ كلمة مرور جديدة لحسابك."
            : "أدخل بريدك الإلكتروني وسنرسل إليك رابطًا لإعادة تعيين كلمة المرور."}
        </p>

        {isReset && !hasToken ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm leading-6 text-amber-900">
            رابط إعادة التعيين غير مكتمل. اطلب رابطًا جديدًا للمتابعة.
          </div>
        ) : isComplete ? (
          <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm leading-7 text-emerald-900">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
            {!isReset ? (
              <div>
                <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold text-neutral-700">البريد الإلكتروني</label>
                <input
                  id="recovery-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-neutral-300 px-4 text-left text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/10"
                  placeholder="name@example.com"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-neutral-700">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 w-full rounded-xl border border-neutral-300 px-4 pl-12 text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                      aria-pressed={showPassword}
                      className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-400 transition-colors hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-neutral-500 sm:grid-cols-2">
                    {PASSWORD_RULES.map((rule) => {
                      const isMet = rule.test(password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-1.5 ${isMet ? "text-emerald-700" : "text-red-600"}`}>
                          {isMet ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                          <span>{rule.label}</span>
                          <span className="sr-only">{isMet ? "مستوفى" : "غير مستوفى"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-neutral-700">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="h-12 w-full rounded-xl border border-neutral-300 px-4 pl-12 text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
                      aria-pressed={showConfirmPassword}
                      className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-neutral-400 transition-colors hover:text-neutral-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`mt-2 flex items-center gap-1.5 text-xs ${password === confirmPassword ? "text-emerald-700" : "text-red-600"}`}>
                      {password === confirmPassword ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                      {password === confirmPassword ? "كلمتا المرور متطابقتان." : "كلمتا المرور غير متطابقتين."}
                    </p>
                  )}
                </div>
              </>
            )}

            {errorMessage && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "جارٍ الإرسال…" : isReset ? "حفظ كلمة المرور الجديدة" : "إرسال رابط إعادة التعيين"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:underline">
          العودة إلى تسجيل الدخول
        </Link>
      </section>
    </main>
  );
}
