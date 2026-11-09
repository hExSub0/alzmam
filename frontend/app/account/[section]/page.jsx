"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bell, Heart, Package, Trash2, User, X } from "lucide-react";
import { Suspense, use, useState } from "react";
import AccountLayout from "../../components/AccountLayout";
import FavoritesPanel from "../../components/FavoritesPanel";
import OrdersPanel from "../../components/OrdersPanel";
import { useAuth } from "../../components/AuthProvider";

const ACCOUNT_SECTIONS = {
  notifications: {
    title: "الإشعارات",
    description: "ستظهر هنا آخر التحديثات والإشعارات الخاصة بحسابك.",
    Icon: Bell,
  },
  orders: {
    title: "الطلبات",
    description: "ستظهر طلباتك هنا بعد إتمام عملية الشراء.",
    Icon: Package,
  },
  favorites: {
    title: "قائمة الأمنيات",
    description: "المنتجات التي حفظتها في قائمة الأمنيات.",
    Icon: Heart,
  },
  profile: {
    title: "حسابي",
    description: "بيانات حسابك الشخصية.",
    Icon: User,
  },
};

function AccountSectionContent({ section, sectionId }) {
  const { user, deleteAccount } = useAuth();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const { title, description, Icon } = section;

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError("");

    try {
      await deleteAccount();
      router.replace("/");
    } catch (error) {
      setDeleteError(error.message || "تعذر حذف الحساب. حاول مرة أخرى.");
      setIsDeletingAccount(false);
    }
  };

  if (sectionId === "favorites") {
    return <FavoritesPanel />;
  }

  if (sectionId === "orders") {
    return <OrdersPanel />;
  }

  if (sectionId === "profile") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl bg-[#1D1F1F] p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 text-xl font-bold">
              {user?.name?.trim()?.charAt(0) || "؟"}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/65">مرحباً بعودتك</p>
              <h2 className="mt-1 truncate text-lg font-bold">{user?.name}</h2>
              <p className="mt-1 truncate text-sm text-white/70" dir="ltr">{user?.email}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900">بيانات الحساب</h2>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">الاسم</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{user?.name || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500">البريد الإلكتروني</p>
              <p className="mt-2 break-all text-sm font-semibold text-gray-900" dir="ltr">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => {
              setDeleteError("");
              setIsDeleteDialogOpen(true);
            }}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <Trash2 size={16} />
            حذف الحساب
          </button>
        </div>

        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6" onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeletingAccount) setIsDeleteDialogOpen(false);
          }}>
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              aria-describedby="delete-account-description"
              className="w-full max-w-md rounded-2xl bg-white p-6 text-right shadow-2xl"
              dir="rtl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle size={22} />
                </div>
                <button
                  type="button"
                  aria-label="إغلاق نافذة التأكيد"
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
              <h2 id="delete-account-title" className="mt-4 text-lg font-bold text-gray-900">تأكيد حذف الحساب</h2>
              <p id="delete-account-description" className="mt-2 text-sm leading-6 text-gray-600">
                سيتم حذف حسابك وجميع جلسات تسجيل الدخول نهائياً. لا يمكن التراجع عن هذا الإجراء.
              </p>
              {deleteError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="min-h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {isDeletingAccount ? "جارٍ حذف الحساب…" : "نعم، احذف الحساب"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-400">
        <Icon size={30} strokeWidth={1.5} />
      </div>
      <h2 className="mt-5 text-base font-semibold text-gray-700">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function AccountSectionPageContent({ params }) {
  const { section: sectionId } = use(params);
  const section = ACCOUNT_SECTIONS[sectionId] || ACCOUNT_SECTIONS.profile;

  return (
    <AccountLayout activeSection={sectionId} title={section.title}>
      <AccountSectionContent section={section} sectionId={sectionId} />
    </AccountLayout>
  );
}

export default function AccountSectionPage({ params }) {
  return (
    <Suspense fallback={null}>
      <AccountSectionPageContent params={params} />
    </Suspense>
  );
}
