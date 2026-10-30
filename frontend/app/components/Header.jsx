"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ShoppingCart, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { AnimatePresence } from "framer-motion";
import AuthPage from "./AuthPage";

const NAV_ITEMS = [
  { label: "الدروع التذكارية", href: "#", hasDropdown: true },
  { label: "الهدايا الخاصة وهدايا الحفر الداخلي", href: "#", hasDropdown: true },
  { label: "كؤوس وميداليات رياضية", href: "#", hasDropdown: true },
  { label: "هدايا مكتبية", href: "#", hasDropdown: true },
  { label: "الهدايا الدعائية", href: "#", hasDropdown: true },
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-20 gap-4">

        <div className="flex items-center gap-4">
          {/* ── اليمين: اللوجو ── */}
          <div className="shrink-0">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={64}
                height={48}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* ── القائمة بجانب اللوجو ── */}
          <nav className="hidden lg:flex items-center gap-0">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.hasDropdown && setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-1 px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors duration-300 ${
                  item.highlight
                    ? "text-red-500 font-semibold hover:text-red-600"
                    : "text-gray-700 hover:text-gray-950"
                }`}
              >
                {item.label}
                {item.hasDropdown && (
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${
                      openMenu === item.label ? "rotate-180" : ""
                    }`}
                  />
                )}
              </Link>

              {item.hasDropdown && openMenu === item.label && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <p className="px-4 py-2 text-sm text-gray-400 text-center">قريباً...</p>
                </div>
              )}
            </div>
          ))}
          </nav>
        </div>

        {/* ── اليسار: الأيقونات ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => setAuthMode("login")} aria-label="تسجيل الدخول" className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800">
            <User size={20} strokeWidth={1.8} />
          </button>

          <Link href="/cart" aria-label={`سلة التسوق (${itemCount})`} className="relative cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800">
            <ShoppingCart size={20} strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

        </div>

      </div>
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

