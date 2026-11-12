"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Heart, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { AnimatePresence, motion } from "framer-motion";
import AuthPage from "./AuthPage";
import { useAuth } from "./AuthProvider";
import { API_BASE_URL } from "../lib/productApi";

function AccountAvatar() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className="h-9 w-9">
      <path d="M4 35c1.7-7.3 7.4-11 16-11s14.3 3.7 16 11a19 19 0 0 1-32 0Z" fill="#426681" />
      <path d="m14 24 6 5 6-5 4 3-4 9H14l-4-9 4-3Z" fill="#e8eef2" />
      <path d="M16 21h8v7l-4 3-4-3v-7Z" fill="#e7b99a" />
      <path d="M11.5 12.8c0-6.2 3.4-9.6 8.5-9.6s8.5 3.4 8.5 9.6v4.8c0 5.2-3.5 8.8-8.5 8.8s-8.5-3.6-8.5-8.8v-4.8Z" fill="#f2c9a5" />
      <path d="M11.4 14.5c-1.7-7.2 2.2-11.8 8.6-11.8 6.6 0 9.4 4.6 8.5 11.1l-2.3-1.4-1.5-4.1c-2.5 2-6.2 3-11 2.9l-2.3 3.3Z" fill="#4a5261" />
      <path d="m16 26 4 3 4-3-1.2 8h-5.6L16 26Z" fill="#fff" />
    </svg>
  );
}

export default function Header() {
  const [sections, setSections] = useState([]);
  const [authMode, setAuthMode] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const { itemCount } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/sections`, { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : { sections: [] })
      .then((payload) => setSections(payload.sections || []))
      .catch((error) => { if (error.name !== "AbortError") setSections([]); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen && !isMobileMenuOpen) return undefined;

    const closeMenuOnOutsideClick = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeMenuOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    if (isAccountMenuOpen) document.addEventListener("pointerdown", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [isAccountMenuOpen, isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 lg:h-20 lg:gap-4">

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {/* ── اليمين: اللوجو ── */}
          <div className="shrink-0">
            <Link href="/">
              <Image
                src="/images/logo-alzmam.png"
                alt="Logo"
                width={64}
                height={48}
                className="h-8 w-auto object-contain sm:h-9"
                priority
              />
            </Link>
          </div>

          {/* ── القائمة بجانب اللوجو ── */}
          <nav aria-label="التنقل الرئيسي" className="hidden lg:flex items-center gap-0">
          {sections.map((section) => (
            <Link
              key={section._id}
              href={`/products?section=${encodeURIComponent(section.slug || section._id)}`}
              className="cursor-pointer rounded-md px-3 py-2 text-sm whitespace-nowrap text-gray-700 transition-colors duration-300 hover:text-gray-950"
            >
              {section.name}
            </Link>
          ))}
          </nav>
        </div>

        {/* ── اليسار: الأيقونات ── */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                aria-label="قائمة الحساب"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className="flex cursor-pointer items-center rounded-full p-1 text-gray-600 transition-colors hover:text-gray-950"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full">
                  <AccountAvatar />
                </span>
              </button>

              <AnimatePresence>
                {isAccountMenuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, x: "-50%", scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                    exit={{ opacity: 0, y: -4, x: "-50%", scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-[60] mt-3 w-60 origin-top overflow-hidden rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
                  >
                    <div className="border-b border-gray-100 px-4 pb-3 pt-2 text-right">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/account/notifications" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                        <Bell size={17} />
                        الإشعارات
                      </Link>
                      <Link href="/account/orders" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                        <Package size={17} />
                        الطلبات
                      </Link>
                      <Link href="/account/favorites" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                        <Heart size={17} />
                        قائمة الأمنيات
                      </Link>
                      <Link href="/account/profile" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                        <User size={17} />
                        حسابي
                      </Link>
                      {user.role === "admin" && (
                        <Link href="/admin" role="menuitem" onClick={() => setIsAccountMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                          <LayoutDashboard size={17} />
                          لوحة التحكم
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          logout().catch(() => {});
                        }}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-right text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut size={17} />
                        تسجيل الخروج
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              aria-label="تسجيل الدخول"
              className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800"
            >
              <User size={20} strokeWidth={1.8} />
            </button>
          )}

          <Link href="/cart" aria-label={`سلة التسوق (${itemCount})`} className="relative cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800">
            <ShoppingCart size={20} strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 lg:hidden"
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

        </div>

      </div>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            id="mobile-navigation"
            aria-label="قائمة التنقل"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-t border-gray-100 bg-white px-4 pb-5 pt-3 shadow-xl lg:hidden"
            dir="rtl"
          >
            <p className="px-1 pb-2 text-xs font-semibold text-gray-400">تصفح الأقسام</p>
            <div className="divide-y divide-gray-100">
              {sections.map((section) => (
                <Link key={section._id} href={`/products?section=${encodeURIComponent(section.slug || section._id)}`} onClick={() => setIsMobileMenuOpen(false)} className="flex min-h-12 cursor-pointer items-center gap-3 py-3 text-sm text-gray-700 hover:text-black">
                  <span>{section.name}</span>
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {authMode && (
          <AuthPage
            mode={authMode}
            modal
            onClose={() => setAuthMode(null)}
            onModeChange={setAuthMode}
          />
        )}
      </AnimatePresence>
    </header>
  );
}

