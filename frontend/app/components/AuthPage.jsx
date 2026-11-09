"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";

const EASE = [0.16, 1, 0.3, 1];
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

function FieldError({ id, message }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="overflow-hidden"
        >
          <p id={id} role="alert" className="pt-2 text-sm text-red-600">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AuthField({ id, label, icon: Icon, error, children }) {
  const inputClassName = [
    "w-full rounded-xl border bg-white py-3.5 pr-11 pl-4 text-base",
    "text-neutral-900 outline-none transition-colors duration-150 focus:ring-2",
    error
      ? "border-red-500 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20"
      : "border-neutral-300 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-gray-500/10",
  ].join(" ");

  return (
    <motion.div variants={itemVariants} className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-sm font-semibold text-neutral-700">
        {label}
      </label>
      <div className="relative">
        <span
          className={`pointer-events-none absolute right-4 top-0 flex h-14 items-center ${
            error ? "text-red-500" : "text-neutral-400"
          }`}
        >
          <Icon size={18} />
        </span>
        {children({
          id,
          className: inputClassName,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? `${id}-error` : undefined,
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </motion.div>
  );
}

export default function AuthPage({ mode, modal = false, onClose, onModeChange, onLoginSuccess, initialMessage = "" }) {
  const router = useRouter();
  const { login, register, verifyEmail, resendVerification } = useAuth();
  const isRegister = mode === "register";
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const verificationInputRefs = useRef([]);
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalMessage, setGlobalMessage] = useState(initialMessage);
  const passwordRequirements = [
    { label: "8 أحرف على الأقل", isMet: formData.password.length >= 8 },
    { label: "حرف إنجليزي كبير واحد على الأقل", isMet: /[A-Z]/.test(formData.password) },
    { label: "حرف إنجليزي صغير واحد على الأقل", isMet: /[a-z]/.test(formData.password) },
    { label: "رقم واحد على الأقل", isMet: /[0-9]/.test(formData.password) },
    { label: "رمز خاص واحد على الأقل", isMet: /[^A-Za-z0-9]/.test(formData.password) },
  ];

  useEffect(() => {
    if (resendCountdown === 0) return undefined;

    const countdownTimer = window.setTimeout(() => {
      setResendCountdown((remainingSeconds) => Math.max(remainingSeconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(countdownTimer);
  }, [resendCountdown]);

  useEffect(() => {
    if (!modal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, onClose]);

  const switchMode = (nextMode) => {
    setErrors({});
    setGlobalMessage("");
    setVerificationCode("");
    setIsVerificationStep(false);

    if (onModeChange) {
      onModeChange(nextMode);
      return;
    }

    router.push(nextMode === "register" ? "/register" : "/login");
  };

  const updateField = (fieldName) => (event) => {
    setFormData((currentForm) => ({
      ...currentForm,
      [fieldName]: event.target.value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "",
      ...(fieldName === "password" ? { confirmPassword: "" } : {}),
    }));
    setGlobalMessage("");
  };

  const updateVerificationDigit = (index, value) => {
    const digits = value.replace(/\D/g, "");
    const nextCode = verificationCode.padEnd(6, " ").split("");

    if (digits.length > 1) {
      const pastedDigits = digits.slice(0, 6 - index).split("");
      pastedDigits.forEach((digit, digitIndex) => {
        nextCode[index + digitIndex] = digit;
      });
      setVerificationCode(nextCode.join(""));
      verificationInputRefs.current[Math.min(index + pastedDigits.length, 5)]?.focus();
      return;
    }

    nextCode[index] = digits || " ";
    setVerificationCode(nextCode.join(""));

    if (digits && index < 5) {
      verificationInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerificationKeyDown = (index, event) => {
    if (event.key === "Backspace" && !verificationCode[index] && index > 0) {
      verificationInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      verificationInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      verificationInputRefs.current[index + 1]?.focus();
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || isResendingCode) return;

    setIsResendingCode(true);
    setGlobalMessage("");

    try {
      await resendVerification({ email: formData.email.trim().toLowerCase() });
      setVerificationCode("");
      setResendCountdown(60);
      setGlobalMessage("تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.");
    } catch (error) {
      if (error.code === "RESEND_COOLDOWN") {
        setResendCountdown(60);
      }
      setGlobalMessage(error.message);
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (isVerificationStep && !/^\d{6}$/.test(verificationCode)) {
      nextErrors.verificationCode = "أدخل رمز التحقق المكوّن من ستة أرقام.";
    }
    if (isRegister && !isVerificationStep && !formData.firstName.trim()) {
      nextErrors.firstName = "أدخل الاسم الأول.";
    }
    if (isRegister && !isVerificationStep && !formData.lastName.trim()) {
      nextErrors.lastName = "أدخل اسم العائلة.";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "أدخل بريدك الإلكتروني.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      nextErrors.email = "أدخل بريدًا إلكترونيًا صحيحًا.";
    }
    if (!isVerificationStep && !formData.password) {
      nextErrors.password = "أدخل كلمة المرور.";
    } else if (
      isRegister
      && !isVerificationStep
      && passwordRequirements.some((requirement) => !requirement.isMet)
    ) {
      nextErrors.password = "تأكد من استيفاء متطلبات كلمة المرور.";
    }
    if (isRegister && !isVerificationStep && !formData.confirmPassword) {
      nextErrors.confirmPassword = "أعد إدخال كلمة المرور للتأكيد.";
    } else if (
      isRegister
      && !isVerificationStep
      && formData.password !== formData.confirmPassword
    ) {
      nextErrors.confirmPassword = "كلمتا المرور غير متطابقتين.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setGlobalMessage("");

    try {
      const email = formData.email.trim().toLowerCase();

      if (isVerificationStep) {
        await verifyEmail({ email, code: verificationCode });
        setFormData((currentForm) => ({
          ...currentForm,
          password: "",
          confirmPassword: "",
        }));
        const verificationSuccessMessage = "تم إنشاء الحساب وتأكيد البريد الإلكتروني. يمكنك تسجيل الدخول الآن.";
        if (modal) {
          switchMode("login");
          setGlobalMessage(verificationSuccessMessage);
        } else {
          router.replace("/login?verified=1");
        }
        return;
      }

      if (isRegister) {
        await register({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email,
          password: formData.password,
        });

        setIsVerificationStep(true);
        setResendCountdown(60);
        setGlobalMessage("");
        return;
      }

      const signedInUser = await login({
        email,
        password: formData.password,
      });

      if (modal) {
        onLoginSuccess?.(signedInUser);
        onClose?.();
        return;
      }

      router.replace(signedInUser.role === "admin" ? "/admin" : "/");
    } catch (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setIsVerificationStep(true);
        setVerificationCode("");
        setResendCountdown(60);
        setErrors({});
        setGlobalMessage("");
        return;
      }

      setGlobalMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isVerificationStep
    ? "تأكيد البريد الإلكتروني"
    : isRegister
      ? "أنشئ حسابك في الزمام"
      : "مرحبًا بعودتك إلى الزمام";
  const pageDescription = isVerificationStep
    ? "تحقق من بريدك الإلكتروني للمتابعة."
    : isRegister
      ? "أنشئ حسابًا وابدأ تجربة التسوق."
      : "سجّل الدخول للمتابعة.";
  const submitLabel = isVerificationStep
    ? "تأكيد البريد الإلكتروني"
    : isRegister
      ? "متابعة"
      : "تسجيل الدخول";

  const formContent = (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-md"
    >
      <motion.div variants={itemVariants} className="mb-8 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-neutral-300 text-neutral-500">
          <User size={28} strokeWidth={1.8} />
        </div>
        <h1 className="mb-3 text-3xl font-bold leading-snug text-neutral-900 sm:text-4xl">
          {pageTitle}
        </h1>
        <p className="text-base text-neutral-500">{pageDescription}</p>
      </motion.div>

      <motion.form
        variants={containerVariants}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5"
      >
        {isRegister && !isVerificationStep && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthField id="firstName" label="الاسم الأول" icon={User} error={errors.firstName}>
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={updateField("firstName")}
                  placeholder="أدخل اسمك الأول"
                />
              )}
            </AuthField>
            <AuthField id="lastName" label="اسم العائلة" icon={User} error={errors.lastName}>
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={updateField("lastName")}
                  placeholder="أدخل اسم العائلة"
                />
              )}
            </AuthField>
          </motion.div>
        )}

        {!isVerificationStep && (
          <AuthField id="email" label="البريد الإلكتروني" icon={Mail} error={errors.email}>
            {(inputProps) => (
              <input
                {...inputProps}
                type="email"
                dir="ltr"
                autoComplete="email"
                value={formData.email}
                onChange={updateField("email")}
                placeholder="name@example.com"
              />
            )}
          </AuthField>
        )}

        {isVerificationStep && (
          <motion.div variants={itemVariants} className="flex flex-col">
            <label htmlFor="verificationCode-0" className="mb-3 text-center text-sm font-semibold leading-6 text-neutral-700">
              أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى
              <span className="mt-1 block font-medium text-neutral-500" dir="ltr">
                {formData.email}
              </span>
            </label>
            <motion.div
              variants={containerVariants}
              className="flex justify-center gap-2"
              dir="ltr"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <motion.input
                  key={index}
                  variants={itemVariants}
                  ref={(element) => {
                    verificationInputRefs.current[index] = element;
                  }}
                  id={index === 0 ? "verificationCode-0" : undefined}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`الرقم ${index + 1} من 6`}
                  aria-invalid={Boolean(errors.verificationCode)}
                  maxLength={6}
                  value={verificationCode[index] || ""}
                  onChange={(event) => updateVerificationDigit(index, event.target.value)}
                  onKeyDown={(event) => handleVerificationKeyDown(index, event)}
                  className="h-12 w-11 rounded-xl border border-neutral-300 bg-white text-center text-lg text-neutral-900 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-gray-500/10"
                />
              ))}
            </motion.div>
            <FieldError id="verificationCode-error" message={errors.verificationCode} />
            <div className="mt-4 flex flex-col items-center gap-1 text-sm">
              <span className="text-neutral-500">لم يصلك الرمز؟</span>
              {resendCountdown > 0 ? (
                <span className="text-neutral-500">
                  إعادة إرسال الرمز بعد {resendCountdown} ث
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingCode}
                  className="cursor-pointer font-semibold text-neutral-800 hover:text-neutral-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {isResendingCode ? "جارٍ إرسال الرمز…" : "إعادة إرسال الرمز"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {!isVerificationStep && (
          <AuthField id="password" label="كلمة المرور" icon={Lock} error={errors.password}>
            {(inputProps) => (
              <>
                <input
                  {...inputProps}
                  className={`${inputProps.className} h-14`}
                  style={{ height: "3.5rem", paddingTop: 0, paddingBottom: 0, paddingLeft: "2.75rem" }}
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={formData.password}
                  onChange={updateField("password")}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder={isRegister ? "أدخل كلمة المرور" : "كلمة المرور"}
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute left-4 top-0 flex h-14 cursor-pointer items-center text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <AnimatePresence initial={false}>
                  {isRegister && isPasswordFocused && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -4, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", y: 0, marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, y: -4, marginTop: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="grid grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2"
                      dir="rtl"
                    >
                      {passwordRequirements.map((requirement) => (
                        <p
                          key={requirement.label}
                          className={`flex items-center gap-2 text-xs ${
                            requirement.isMet ? "text-emerald-700" : "text-neutral-500"
                          }`}
                        >
                          <span aria-hidden="true" className="flex w-4 justify-center">
                            {requirement.isMet ? <Check size={15} /> : <X size={14} />}
                          </span>
                          {requirement.label}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </AuthField>
        )}

        {!isRegister && !isVerificationStep && (
          <motion.div variants={itemVariants} className="-mt-2 text-left">
            <Link href="/forgot-password" className="text-sm font-semibold text-neutral-700 hover:text-neutral-950 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </motion.div>
        )}

        {isRegister && !isVerificationStep && (
          <AuthField
            id="confirmPassword"
            label="تأكيد كلمة المرور"
            icon={Lock}
            error={errors.confirmPassword}
          >
            {(inputProps) => (
              <>
                <input
                  {...inputProps}
                  className={`${inputProps.className} h-14`}
                  style={{ height: "3.5rem", paddingTop: 0, paddingBottom: 0, paddingLeft: "2.75rem" }}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={updateField("confirmPassword")}
                  placeholder="أعد إدخال كلمة المرور"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute left-4 top-0 flex h-14 cursor-pointer items-center text-neutral-400 transition-colors hover:text-neutral-700"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </>
            )}
          </AuthField>
        )}

        <AnimatePresence initial={false}>
          {globalMessage && (
            <motion.p
              role="status"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-sm text-neutral-700"
            >
              {globalMessage}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          variants={itemVariants}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex w-full cursor-pointer items-center justify-center rounded-xl bg-neutral-900 py-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-neutral-700 disabled:cursor-wait disabled:opacity-60"
        >
              {isSubmitting ? "يرجى الانتظار…" : submitLabel}
        </motion.button>

        {!isVerificationStep && (
          <motion.p variants={itemVariants} className="text-center text-sm text-neutral-500">
            {isRegister ? "لديك حساب بالفعل؟" : "ليس لديك حساب؟"}{" "}
            {onModeChange ? (
              <button
                type="button"
                onClick={() => switchMode(isRegister ? "login" : "register")}
                className="cursor-pointer font-semibold text-neutral-900 hover:underline"
              >
                {isRegister ? "تسجيل الدخول" : "إنشاء حساب"}
              </button>
            ) : (
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-semibold text-neutral-900 hover:underline"
              >
                {isRegister ? "تسجيل الدخول" : "إنشاء حساب"}
              </Link>
            )}
          </motion.p>
        )}
      </motion.form>
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
          aria-label={pageTitle}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseDown={(event) => event.stopPropagation()}
          className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-white px-6 py-8 shadow-2xl sm:px-10"
          dir="rtl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute left-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={19} />
          </button>
          {formContent}
        </motion.section>
      </motion.div>
    );
  }

  return (
    <main dir="rtl" className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-12">
      {formContent}
    </main>
  );
}
