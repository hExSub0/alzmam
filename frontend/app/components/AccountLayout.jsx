"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  User,
} from "lucide-react";
import Footer from "./Footer";
import Header from "./Header";
import TopHeader from "./TopHeader";
import { useAuth } from "./AuthProvider";

const ACCOUNT_LINKS = [
  { id: "notifications", label: "الإشعارات", href: "/account/notifications", icon: Bell },
  { id: "orders", label: "الطلبات", href: "/account/orders", icon: Package },
  { id: "favorites", label: "قائمة الأمنيات", href: "/account/favorites", icon: Heart },
  { id: "profile", label: "حسابي", href: "/account/profile", icon: User },
];

export default function AccountLayout({ activeSection, title, children }) {
  const router = useRouter();
  const { user, isReady, logout } = useAuth();

  const handleLogout = async () => {
    await logout().catch(() => {});
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <TopHeader />
      <Header />

      <section className="h-44 border-b border-gray-200 bg-[#F9FAFB]">
        <div className="mx-auto flex h-full max-w-7xl items-start justify-end px-4 pt-7 text-sm text-gray-500 sm:px-6">
          <nav aria-label="مسار التنقل" className="flex items-center gap-2">
            <Link href="/" className="transition-colors hover:text-black">الرئيسية</Link>
            <span aria-hidden="true">›</span>
            <Link href="/account" className="transition-colors hover:text-black">حسابي</Link>
            <span aria-hidden="true">›</span>
            <span>{title}</span>
          </nav>
        </div>
      </section>

      <main className="relative mx-auto -mt-24 grid w-full max-w-7xl flex-1 content-start gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-8" dir="rtl">
        <aside aria-label="قائمة الحساب" className="h-fit rounded-xl border border-gray-100 bg-white p-3 shadow-[0_12px_35px_rgba(0,0,0,0.06)] lg:sticky lg:top-6 lg:self-start lg:p-5">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {ACCOUNT_LINKS.map(({ id, label, href, icon: Icon }) => {
              const isActive = activeSection === id;

              return (
                <Link
                  key={id}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors lg:w-full ${isActive ? "bg-[#1D1F1F] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"}`}
                >
                  <Icon size={18} strokeWidth={1.7} />
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <Link href="/admin" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950 lg:w-full">
                <LayoutDashboard size={18} strokeWidth={1.7} />
                <span className="whitespace-nowrap">لوحة التحكم</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 lg:w-full"
            >
              <LogOut size={18} strokeWidth={1.7} />
              <span className="whitespace-nowrap">تسجيل الخروج</span>
            </button>
          </nav>
        </aside>

        <section className="min-h-[390px] rounded-xl border border-gray-100 bg-white p-5 shadow-[0_12px_35px_rgba(0,0,0,0.04)] sm:p-7">
          <h1 className="mb-6 text-xl font-bold text-[#1D1F1F]">{title}</h1>
          {!isReady ? (
            <p className="py-16 text-center text-sm text-gray-500">جارٍ التحميل…</p>
          ) : !user ? (
            <div className="py-16 text-center">
              <p className="text-sm text-gray-600">سجّل الدخول لعرض وإدارة حسابك.</p>
              <Link href="/login" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1D1F1F] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#343838]">
                تسجيل الدخول
              </Link>
            </div>
          ) : children}
        </section>
      </main>

      <Footer className="mt-0" />
    </div>
  );
}
