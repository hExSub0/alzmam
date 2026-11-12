"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Bell,
  BellRing,
  Check,
  ExternalLink,
  FolderOpen,
  Images,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Volume2,
  VolumeX,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import AdminProducts from "./AdminProducts";
import AdminBanners from "./AdminBanners";
import AdminSections from "./AdminSections";
import AdminOrders from "./AdminOrders";
import { API_BASE_URL } from "../lib/productApi";

const PAGE_SIZE = 50;
const sections = [
  { id: "banners", label: "الغلاف", icon: Images },
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "users", label: "المستخدمون", icon: Users },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "sections", label: "الأقسام", icon: FolderOpen },
  { id: "orders", label: "الطلبات", icon: ShoppingBag },
];

const formatNumber = (value) => new Intl.NumberFormat("ar-SA").format(value);

function LoadingView() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F9FAFB] px-4" dir="rtl">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-5 text-sm text-gray-600 shadow-sm">
        <RefreshCw size={18} className="animate-spin text-[#1D1F1F]" />
        جارٍ التحقق من صلاحية المسؤول…
      </div>
    </main>
  );
}

function AccessMessage({ title, description, action }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F9FAFB] px-4" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-[0_12px_40px_rgba(29,31,31,0.06)]">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-[#F3F4F6] text-[#1D1F1F]">
          <ShieldCheck size={25} />
        </div>
        <h1 className="text-xl font-bold text-[#1D1F1F]">{title}</h1>
        <p className="mt-2 text-sm leading-7 text-gray-500">{description}</p>
        {action}
      </section>
    </main>
  );
}

function StatCard({ label, value, icon: Icon, note, accent = "gold" }) {
  const accentClasses = accent === "green"
    ? "bg-emerald-50 text-emerald-700"
    : accent === "blue"
      ? "bg-sky-50 text-sky-700"
      : "bg-[#F3F4F6] text-[#1D1F1F]";

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(29,31,31,0.035)] transition-shadow hover:shadow-[0_8px_26px_rgba(29,31,31,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#1D1F1F]">{value}</p>
          <p className="mt-2 text-xs leading-5 text-gray-400">{note}</p>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accentClasses}`}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ isPositive, positiveLabel, negativeLabel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
      isPositive
        ? "bg-emerald-50 text-emerald-700"
        : "bg-gray-100 text-gray-500"
    }`}>
      {isPositive ? <Check size={13} /> : <X size={13} />}
      {isPositive ? positiveLabel : negativeLabel}
    </span>
  );
}

function UsersTable({ users, currentUserId, onRoleChange, onStatusChange, isUpdating }) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-50 text-gray-400">
          <Users size={20} />
        </div>
        <p className="text-sm font-semibold text-gray-700">لا يوجد مستخدمون مطابقون للبحث</p>
        <p className="mt-1 text-xs text-gray-400">جرّب البحث باسم أو بريد إلكتروني آخر.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <table className="w-full min-w-[780px] text-right text-sm">
        <thead className="border-b border-gray-100 bg-[#FAFAF8] text-xs text-gray-500">
          <tr>
            <th className="px-5 py-4 font-semibold">المستخدم</th>
            <th className="px-5 py-4 font-semibold">الصلاحية</th>
            <th className="px-5 py-4 font-semibold">البريد الإلكتروني</th>
            <th className="px-5 py-4 font-semibold">حالة الحساب</th>
            <th className="px-5 py-4 font-semibold">تاريخ التسجيل</th>
            <th className="px-5 py-4 font-semibold">إدارة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => {
            const userId = user.id || user._id;
            const isCurrentUser = String(userId) === String(currentUserId);
            const isBusy = isUpdating === userId;

            return (
              <tr key={userId} className="transition-colors hover:bg-[#FCFBF8]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3F4F6] text-sm font-bold text-[#1D1F1F]">
                      {user.name?.trim().charAt(0) || "؟"}
                    </div>
                    <p className="font-semibold text-[#1D1F1F]">{user.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-[#F3F4F6] text-[#1D1F1F]"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {user.role === "admin" ? "مسؤول" : "عميل"}
                  </span>
                </td>
                <td className="px-5 py-4 text-gray-500" dir="ltr">{user.email}</td>
                <td className="px-5 py-4">
                  <StatusBadge
                    isPositive={user.isActive}
                    positiveLabel="نشط"
                    negativeLabel="معطّل"
                  />
                  {!user.isEmailVerified && (
                    <span className="mr-2 inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                      غير موثّق
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy || isCurrentUser}
                      onClick={() => onRoleChange(user)}
                      className="cursor-pointer whitespace-nowrap rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs font-semibold text-[#1D1F1F] transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {user.role === "admin" ? "جعله عميلًا" : "ترقيته لمسؤول"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || isCurrentUser}
                      onClick={() => onStatusChange(user)}
                      className="cursor-pointer whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {user.isActive ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmptyManagementSection({ section }) {
  const isProductSection = section === "products";
  const title = isProductSection ? "إدارة المنتجات" : "إدارة الطلبات";
  const description = isProductSection
    ? "كتالوج المنتجات الحالي محفوظ في الواجهة الأمامية. ستظهر أدوات الإدارة هنا بعد ربط المنتجات بقاعدة البيانات."
    : "ستتوفر إدارة الطلبات بعد ربط السلة بواجهة إنشاء الطلبات وحفظها في قاعدة البيانات.";
  const Icon = isProductSection ? Package : ShoppingBag;

  return (
    <section className="grid min-h-80 place-items-center rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow-[0_4px_18px_rgba(29,31,31,0.035)]">
      <div className="max-w-md">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-[#F3F4F6] text-[#1D1F1F]">
          <Icon size={27} strokeWidth={1.7} />
        </div>
        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
          قريبًا
        </span>
        <h2 className="mt-3 text-xl font-bold text-[#1D1F1F]">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-gray-500">{description}</p>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isReady, logout, request, getAccessToken } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingUserId, setIsUpdatingUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notificationMenuRef = useRef(null);
  const notificationStateRef = useRef([]);
  const audioContextRef = useRef(null);
  const soundEnabledRef = useRef(true);
  const notificationStorageKey = user?.id ? `admin-order-notifications:${user.id}` : "admin-order-notifications";

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!notificationMenuRef.current?.contains(event.target)) setIsNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isNotificationsOpen]);

  useEffect(() => {
    try {
      const savedNotifications = JSON.parse(localStorage.getItem(notificationStorageKey) || "[]");
      const nextNotifications = Array.isArray(savedNotifications) ? savedNotifications.slice(0, 50) : [];
      notificationStateRef.current = nextNotifications;
      setNotifications(nextNotifications);
      setSoundEnabled(localStorage.getItem("admin-order-sound-enabled") !== "false");
    } catch {
      notificationStateRef.current = [];
      setNotifications([]);
    }
  }, [notificationStorageKey]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    try { localStorage.setItem("admin-order-sound-enabled", String(soundEnabled)); } catch {}
  }, [soundEnabled]);

  const unlockNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current || audioContextRef.current || typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContextRef.current = new AudioContextClass();
    audioContextRef.current.resume().catch(() => {});
  }, []);

  const toggleNotificationSound = () => {
    const nextEnabled = !soundEnabledRef.current;
    soundEnabledRef.current = nextEnabled;
    setSoundEnabled(nextEnabled);
    if (nextEnabled) unlockNotificationSound();
  };

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current || !audioContextRef.current) return;
    const context = audioContextRef.current;
    const playChime = () => {
      const startAt = context.currentTime;
      [880, 1174].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const noteStart = startAt + index * 0.16;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        volume.gain.setValueAtTime(0.0001, noteStart);
        volume.gain.exponentialRampToValueAtTime(0.13, noteStart + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.32);
        oscillator.connect(volume);
        volume.connect(context.destination);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + 0.34);
      });
    };
    if (context.state === "suspended") context.resume().then(playChime).catch(() => {});
    else playChime();
  }, []);

  useEffect(() => {
    if (!isReady || user?.role !== "admin") return undefined;
    window.addEventListener("pointerdown", unlockNotificationSound, { once: true });
    window.addEventListener("keydown", unlockNotificationSound, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockNotificationSound);
      window.removeEventListener("keydown", unlockNotificationSound);
    };
  }, [isReady, user?.role, unlockNotificationSound]);

  const addOrderNotification = useCallback((order) => {
    const currentNotifications = notificationStateRef.current;
    if (currentNotifications.some((notification) => notification.orderId === order.id)) return;
    const nextNotifications = [{
      ...order,
      orderId: order.id,
      read: false,
      receivedAt: new Date().toISOString(),
    }, ...currentNotifications].slice(0, 50);
    notificationStateRef.current = nextNotifications;
    setNotifications(nextNotifications);
    try { localStorage.setItem(notificationStorageKey, JSON.stringify(nextNotifications)); } catch {}
    window.dispatchEvent(new CustomEvent("admin:new-order", { detail: order }));
    playNotificationSound();
  }, [notificationStorageKey, playNotificationSound]);

  const updateNotifications = useCallback((updater) => {
    const nextNotifications = updater(notificationStateRef.current);
    notificationStateRef.current = nextNotifications;
    setNotifications(nextNotifications);
    try { localStorage.setItem(notificationStorageKey, JSON.stringify(nextNotifications)); } catch {}
  }, [notificationStorageKey]);

  const markNotificationsRead = () => updateNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!isReady || user?.role !== "admin") return undefined;
    let socket = null;
    let reconnectTimer = null;
    let isStopped = false;
    let reconnectAttempt = 0;

    const connect = async () => {
      const token = await getAccessToken();
      if (isStopped || !token) return;
      const socketUrl = new URL(API_BASE_URL);
      socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
      socketUrl.pathname = "/ws/admin/orders";
      socketUrl.search = "";
      socket = new WebSocket(socketUrl);
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "authenticate", token })));
      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "ready") reconnectAttempt = 0;
          if (message.type === "new_order" && message.order) addOrderNotification(message.order);
        } catch {}
      });
      socket.addEventListener("close", (event) => {
        if (isStopped || event.code === 4403) return;
        const delay = Math.min(30000, 1000 * (2 ** reconnectAttempt));
        reconnectAttempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      });
      socket.addEventListener("error", () => socket?.close());
    };

    connect();
    return () => {
      isStopped = true;
      window.clearTimeout(reconnectTimer);
      socket?.close(1000, "Dashboard closed");
    };
  }, [isReady, user?.role, getAccessToken, addOrderNotification]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    setErrorMessage("");

    try {
      const response = await request(`/admin/users?page=1&limit=${PAGE_SIZE}`);
      setUsers(response.users);
      setTotalUsers(response.total);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [request]);

  useEffect(() => {
    if (isReady && user?.role === "admin") {
      loadUsers();
    }
  }, [isReady, user, loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((candidate) => (
      candidate.name.toLowerCase().includes(normalizedSearch)
      || candidate.email.toLowerCase().includes(normalizedSearch)
    ));
  }, [users, searchTerm]);

  const updateUser = async (targetUser, changes, endpoint, requestBody) => {
    const targetUserId = targetUser.id || targetUser._id;
    setIsUpdatingUserId(targetUserId);
    setErrorMessage("");

    try {
      const response = await request(endpoint(targetUserId), {
        method: "PATCH",
        body: JSON.stringify(requestBody),
      });

      setUsers((currentUsers) => currentUsers.map((existingUser) => {
        const existingUserId = existingUser.id || existingUser._id;
        return String(existingUserId) === String(targetUserId)
          ? { ...existingUser, ...changes, ...response.user }
          : existingUser;
      }));
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsUpdatingUserId(null);
    }
  };

  const handleRoleChange = (targetUser) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";

    return updateUser(
      targetUser,
      { role: nextRole },
      (userId) => `/admin/users/${userId}/role`,
      { role: nextRole },
    );
  };

  const handleStatusChange = (targetUser) => {
    const nextStatus = !targetUser.isActive;

    return updateUser(
      targetUser,
      { isActive: nextStatus },
      (userId) => `/admin/users/${userId}/status`,
      { isActive: nextStatus },
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  };

  if (!isReady) return <LoadingView />;

  if (!user) {
    return (
      <AccessMessage
        title="سجّل الدخول للمتابعة"
        description="سجّل الدخول بحساب مسؤول لفتح لوحة إدارة المتجر."
        action={(
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#1D1F1F] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#343737]"
          >
            تسجيل الدخول
          </Link>
        )}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <AccessMessage
        title="هذه الصفحة للمسؤولين فقط"
        description="لا يملك حسابك صلاحية إدارة المتجر."
        action={(
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 cursor-pointer rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            تسجيل الخروج
          </button>
        )}
      />
    );
  }

  const activeSectionDetails = sections.find((section) => section.id === activeSection);
  const activeSectionTitle = activeSectionDetails?.label || "نظرة عامة";
  const verifiedUsersCount = users.filter((candidate) => candidate.isEmailVerified).length;
  const activeAdminsCount = users.filter((candidate) => (
    candidate.role === "admin" && candidate.isActive
  )).length;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1D1F1F]" dir="rtl">
      <header className="bg-[#1D1F1F] text-white shadow-[0_4px_18px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/5 text-[#D1D5DB]">
              <Boxes size={22} strokeWidth={1.7} />
            </span>
            <span>
              <span className="block text-base font-bold tracking-wide">زمام الجودة</span>
              <span className="mt-0.5 block text-xs text-white/55">إدارة المتجر</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div ref={notificationMenuRef} className="relative">
              <button type="button" aria-label={`الإشعارات${unreadNotificationsCount ? `، ${unreadNotificationsCount} غير مقروء` : ""}`} aria-haspopup="dialog" aria-expanded={isNotificationsOpen} onClick={() => setIsNotificationsOpen((open) => !open)} className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                {unreadNotificationsCount ? <BellRing size={19} /> : <Bell size={19} />}
                {unreadNotificationsCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#1D1F1F] bg-amber-400 px-1 text-[10px] font-bold text-gray-900">{unreadNotificationsCount > 9 ? "٩+" : formatNumber(unreadNotificationsCount)}</span>}
              </button>
              {isNotificationsOpen && <section role="dialog" aria-label="إشعارات الطلبات الجديدة" className="absolute left-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white text-right text-gray-900 shadow-xl">
                <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
                  <div><h2 className="text-sm font-bold">إشعارات الطلبات</h2><p className="mt-0.5 text-[11px] text-gray-500">{unreadNotificationsCount ? `${formatNumber(unreadNotificationsCount)} إشعار غير مقروء` : "كل الإشعارات مقروءة"}</p></div>
                  <div className="flex items-center gap-1.5">
                    {unreadNotificationsCount > 0 && <button type="button" onClick={markNotificationsRead} className="cursor-pointer rounded-lg px-2 py-1.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-100">قراءة الكل</button>}
                    {notifications.length > 0 && <button type="button" onClick={() => updateNotifications(() => [])} className="cursor-pointer rounded-lg px-2 py-1.5 text-[10px] font-semibold text-red-600 hover:bg-red-50">مسح</button>}
                  </div>
                </header>
                {notifications.length ? <ul className="max-h-[min(60vh,24rem)] divide-y divide-gray-100 overflow-y-auto">{notifications.map((notification) => <li key={notification.orderId}>
                  <button type="button" onClick={() => { updateNotifications((current) => current.map((item) => item.orderId === notification.orderId ? { ...item, read: true } : item)); setActiveSection("orders"); setIsNotificationsOpen(false); }} className={`w-full cursor-pointer px-4 py-3.5 text-right transition hover:bg-gray-50 ${notification.read ? "bg-white" : "bg-amber-50/60"}`}>
                    <span className="flex items-start gap-2.5"><span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${notification.read ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}><ShoppingBag size={15} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-xs font-bold">طلب جديد #{notification.code}</span>{!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />}</span><span className="mt-1 block truncate text-xs text-gray-600">{notification.customerName} · {formatNumber(notification.itemCount)} منتجات</span><span className="mt-1 block text-[11px] font-semibold text-emerald-700">{new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(notification.total)} ر.س</span><span className="mt-1 block text-[10px] text-gray-400">{new Date(notification.createdAt || notification.receivedAt).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}</span></span></span>
                  </button>
                </li>)}</ul> : <div className="px-5 py-10 text-center"><Bell size={23} className="mx-auto text-gray-300" /><p className="mt-2 text-xs font-semibold text-gray-600">لا توجد إشعارات جديدة</p><p className="mt-1 text-[11px] text-gray-400">ستظهر الطلبات الجديدة هنا فور وصولها.</p></div>}
              </section>}
            </div>
            <button type="button" onClick={toggleNotificationSound} aria-label={soundEnabled ? "إيقاف صوت إشعارات الطلبات" : "تفعيل صوت إشعارات الطلبات"} title={soundEnabled ? "إيقاف صوت الإشعارات" : "تفعيل صوت الإشعارات"} className={`hidden h-10 w-10 cursor-pointer place-items-center rounded-xl transition-colors hover:bg-white/10 sm:grid ${soundEnabled ? "text-white/75 hover:text-white" : "text-amber-300"}`}>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="mt-0.5 text-xs text-white/55" dir="ltr">{user.email}</p>
            </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[#D1D5DB] sm:hidden">
              <UserRound size={19} />
            </span>
            <span className="hidden h-9 w-px bg-white/15 sm:block" />
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/85 transition-colors hover:bg-white/10 sm:px-4 sm:text-sm"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">عرض المتجر</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="تسجيل الخروج"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl text-white/65 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400">المتجر <span className="mx-1.5">/</span> لوحة التحكم</p>
            <h1 className="mt-2 text-2xl font-bold text-[#1D1F1F] sm:text-3xl">{activeSectionTitle}</h1>
            <p className="mt-2 text-sm text-gray-500">مرحبًا {user.name}، إليك إدارة متجرك من مكان واحد.</p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoadingUsers}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[#D1D5DB] hover:bg-gray-50 hover:text-[#1D1F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D1F1F]/10 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw size={16} className={isLoadingUsers ? "animate-spin" : ""} />
            تحديث البيانات
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_4px_18px_rgba(29,31,31,0.035)] lg:sticky lg:top-6 lg:flex-col lg:gap-1 lg:overflow-visible" aria-label="أقسام لوحة التحكم">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors sm:px-5 lg:w-full lg:justify-start ${
                  isActive
                    ? "bg-[#1D1F1F] text-white shadow-sm"
                    : "text-gray-500 hover:bg-[#FAF9F6] hover:text-[#1D1F1F]"
                }`}
              >
                <Icon size={17} strokeWidth={1.8} />
                {section.label}
                {section.id === "users" && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${
                    isActive ? "bg-white/15 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {formatNumber(totalUsers)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
        {errorMessage && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {activeSection === "overview" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="إجمالي المستخدمين" value={formatNumber(totalUsers)} icon={Users} note="جميع الحسابات المسجلة في المتجر" />
              <StatCard label="حسابات موثّقة" value={formatNumber(verifiedUsersCount)} icon={ShieldCheck} note={`من أصل ${formatNumber(users.length)} حسابًا محمّلًا`} accent="green" />
              <StatCard label="المسؤولون النشطون" value={formatNumber(activeAdminsCount)} icon={LayoutDashboard} note={`من أصل ${formatNumber(users.length)} حسابًا محمّلًا`} accent="blue" />
              <StatCard label="المنتجات والطلبات" value="—" icon={Boxes} note="تحتاج إلى ربط واجهات الكتالوج والشراء" />
            </section>

            <section className="mt-7 overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_18px_rgba(29,31,31,0.035)] sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#1D1F1F]">أحدث المستخدمين</h2>
                  <p className="mt-1 text-sm text-gray-500">آخر الحسابات المسجلة في المتجر.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection("users")}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#1D1F1F] transition-colors hover:text-[#343737]"
                >
                  إدارة المستخدمين
                  <ArrowLeft size={15} />
                </button>
              </div>
              {isLoadingUsers ? (
                <div className="grid min-h-40 place-items-center text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> جارٍ تحميل المستخدمين…</span>
                </div>
              ) : (
                <UsersTable
                  users={users.slice(0, 5)}
                  currentUserId={user.id}
                  onRoleChange={handleRoleChange}
                  onStatusChange={handleStatusChange}
                  isUpdating={isUpdatingUserId}
                />
              )}
            </section>
          </>
        )}

        {activeSection === "users" && (
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">{formatNumber(totalUsers)} مستخدم</p>
              <div className="relative w-full sm:w-80">
                <Search size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث بالاسم أو البريد الإلكتروني"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-11 pl-4 text-right text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#1D1F1F] focus:ring-2 focus:ring-[#1D1F1F]/15"
                />
              </div>
            </div>
            {isLoadingUsers ? (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-gray-100 bg-white text-sm text-gray-500">
                <span className="inline-flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> جارٍ تحميل المستخدمين…</span>
              </div>
            ) : (
              <UsersTable
                users={filteredUsers}
                currentUserId={user.id}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                isUpdating={isUpdatingUserId}
              />
            )}
          </section>
        )}

        {activeSection === "products" && <AdminProducts />}
        {activeSection === "sections" && <AdminSections />}
        {activeSection === "banners" && <AdminBanners />}

        {activeSection === "orders" && <AdminOrders />}
        </div>
        </div>
      </main>
    </div>
  );
}
