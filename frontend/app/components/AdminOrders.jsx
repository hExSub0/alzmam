"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarDays, Check, ChevronDown, Clock3, FileText, MapPin, Mail, PackageCheck, Phone, RefreshCw, Search, ShoppingBag, Truck, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { formatCurrency } from "./CartProvider";
import { getProductImageUrl } from "../lib/productApi";

const ORDER_STATUSES = [
  { value: "pending", label: "قيد المراجعة", Icon: Clock3, menuColor: "text-amber-700" },
  { value: "confirmed", label: "تم التأكيد", Icon: BadgeCheck, menuColor: "text-sky-700" },
  { value: "shipped", label: "تم الشحن", Icon: Truck, menuColor: "text-violet-700" },
  { value: "delivered", label: "تم التوصيل", Icon: PackageCheck, menuColor: "text-emerald-700" },
  { value: "cancelled", label: "ملغي", Icon: XCircle, menuColor: "text-red-700" },
];
const normalizeSearchText = (value) => String(value || "")
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
  .toLocaleLowerCase("ar")
  .trim();

function OrderStatusMenu({ order, isBusy, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = ORDER_STATUSES.find((status) => status.value === order.status) || ORDER_STATUSES[0];
  const StatusIcon = current.Icon;

  return <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false); }}>
    <button type="button" aria-haspopup="menu" aria-expanded={isOpen} aria-controls={`order-status-${order._id}`} disabled={isBusy} onClick={() => setIsOpen((open) => !open)} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-gray-700 ring-1 ring-inset ring-gray-200 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60">
      {isBusy ? <RefreshCw size={15} className="animate-spin text-gray-400" /> : <StatusIcon size={16} className={current.menuColor} />}
      <span className={isBusy ? "text-gray-500" : current.menuColor}>{isBusy ? "جارٍ التحديث" : current.label}</span><ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
    {isOpen && <div id={`order-status-${order._id}`} role="menu" aria-label="تغيير حالة الطلب" onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }} className="absolute left-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 text-right shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
      <p className="border-b border-gray-100 px-2.5 pb-2.5 pt-1.5 text-[11px] font-semibold text-gray-500">حالة الطلب</p>
      <div className="mt-1 space-y-0.5">
        {ORDER_STATUSES.map(({ value, label, Icon, menuColor }) => {
          const isCurrent = order.status === value;
          return <button key={value} type="button" role="menuitem" disabled={isBusy || isCurrent} onClick={() => { setIsOpen(false); onChange(value); }} className={`flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-right text-xs transition-colors disabled:cursor-default ${isCurrent ? `bg-gray-50 font-bold ${menuColor}` : `font-semibold ${menuColor} hover:bg-gray-50`} ${value === "cancelled" ? "mt-1 border-t border-gray-100 pt-2" : ""}`}>
            <Icon size={15} strokeWidth={1.8} className={menuColor} />
            <span>{label}</span>
            {isCurrent && <Check size={14} className="mr-auto text-emerald-600" />}
          </button>;
        })}
      </div>
    </div>}
  </div>;
}

function Detail({ icon: Icon, label, value, ltr = false }) {
  return <div className="flex min-w-0 items-start gap-2.5 rounded-xl bg-gray-50/80 px-3 py-3">
    <Icon size={15} className="mt-0.5 shrink-0 text-gray-400" />
    <div className="min-w-0"><p className="text-[10px] font-medium text-gray-400">{label}</p><p dir={ltr ? "ltr" : undefined} className={`mt-1 truncate text-xs font-semibold text-gray-700 ${ltr ? "text-right" : ""}`}>{value || "—"}</p></div>
  </div>;
}

export default function AdminOrders() {
  const { request } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = useCallback(async (showInitialLoader = false) => {
    if (showInitialLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await request("/admin/orders");
      setOrders(result.orders || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "تعذر تحميل الطلبات.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [request]);

  useEffect(() => { loadOrders(true); }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = normalizeSearchText(searchQuery).replace(/^#/, "");
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!query) return true;
      const searchableValues = [
        order._id,
        String(order._id).slice(-8),
        order.customer?.name,
        order.customer?.phone,
        order.customer?.email,
        order.customer?.city,
        order.customer?.address,
        ...(order.items || []).map((item) => item.name),
      ];
      return searchableValues.some((value) => normalizeSearchText(value).includes(query));
    });
  }, [orders, searchQuery, statusFilter]);

  const changeStatus = async (orderId, status) => {
    setBusyId(orderId);
    try {
      const result = await request(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setOrders((current) => current.map((order) => order._id === orderId ? result.order : order));
      setError("");
    } catch (requestError) {
      setError(requestError.message || "تعذر تحديث حالة الطلب.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="grid min-h-48 place-items-center rounded-2xl border border-gray-100 bg-white text-sm text-gray-500"><RefreshCw size={18} className="animate-spin" /></div>;
  return <section className="space-y-5" dir="rtl">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <div><h2 className="text-lg font-bold text-[#1D1F1F]">طلبات العملاء</h2><p className="mt-1 text-xs text-gray-500">إدارة ومتابعة طلبات المتجر</p></div>
      <div className="flex items-center gap-3"><span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">{new Intl.NumberFormat("ar-SA").format(orders.length)} طلب</span><button type="button" onClick={() => loadOrders()} disabled={refreshing} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />تحديث</button></div>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm text-red-700">{error}</p>}
    {!!orders.length && <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <label className="relative block">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="ابحث برقم الطلب أو اسم العميل أو الجوال..." aria-label="ابحث في الطلبات" className="min-h-12 w-full rounded-xl border border-gray-200 bg-gray-50/70 pr-11 pl-11 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-900/5" />
        {searchQuery && <button type="button" onClick={() => setSearchQuery("")} aria-label="مسح البحث" className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"><X size={16} /></button>}
      </label>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500"><ShoppingBag size={14} />الحالة</span>
        {[{ value: "all", label: "الكل" }, ...ORDER_STATUSES.map(({ value, label }) => ({ value, label }))].map(({ value, label }) => {
          const count = value === "all" ? orders.length : orders.filter((order) => order.status === value).length;
          return <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${statusFilter === value ? "border-[#1D1F1F] bg-[#1D1F1F] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
            {label}<span className={statusFilter === value ? "text-white/70" : "text-gray-400"}>{new Intl.NumberFormat("ar-SA").format(count)}</span>
          </button>;
        })}
      </div>
      <p className="text-xs text-gray-500">عرض <span className="font-bold text-gray-700">{new Intl.NumberFormat("ar-SA").format(filteredOrders.length)}</span> من {new Intl.NumberFormat("ar-SA").format(orders.length)} طلب</p>
    </div>}
    {!orders.length ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center"><ShoppingBag size={30} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-semibold text-gray-700">لا توجد طلبات حتى الآن</p><p className="mt-1 text-xs text-gray-500">ستظهر طلبات العملاء هنا عند إتمام الشراء.</p></div> : filteredOrders.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center"><Search size={26} className="mx-auto text-gray-300" /><p className="mt-3 text-sm font-semibold text-gray-700">لا توجد طلبات مطابقة</p><p className="mt-1 text-xs text-gray-500">جرّب كلمة بحث مختلفة أو غيّر فلتر الحالة.</p><button type="button" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="mt-4 cursor-pointer text-xs font-bold text-gray-800 underline underline-offset-4">مسح البحث والفلاتر</button></div> : filteredOrders.map((order) => <article key={order._id} className="overflow-visible rounded-2xl border border-gray-100 bg-white shadow-[0_5px_22px_rgba(0,0,0,0.04)]">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-t-2xl border-b border-gray-100 bg-[#FCFCFB] px-5 py-4 sm:px-6">
        <div><p className="text-[10px] font-medium text-gray-500">رقم الطلب</p><h3 className="mt-0.5 text-sm font-bold tracking-wide text-[#1D1F1F]" dir="ltr">#{String(order._id).slice(-8).toUpperCase()}</h3></div>
        <div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-1.5 text-xs text-gray-500"><CalendarDays size={14} />{new Date(order.createdAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}</span><OrderStatusMenu order={order} isBusy={busyId === order._id} onChange={(status) => changeStatus(order._id, status)} /></div>
      </header>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]">
        <section><h4 className="mb-3 text-xs font-bold text-gray-800">بيانات العميل والتوصيل</h4><div className="grid gap-2 sm:grid-cols-2">
          <Detail icon={ShoppingBag} label="اسم العميل" value={order.customer.name} />
          <Detail icon={Phone} label="رقم الجوال" value={order.customer.phone} ltr />
          <Detail icon={Mail} label="البريد الإلكتروني" value={order.customer.email} ltr />
          <Detail icon={MapPin} label="المدينة والعنوان" value={[order.customer.city, order.customer.address].filter(Boolean).join("، ")} />
        </div></section>

        <section><div className="mb-3 flex items-center justify-between"><h4 className="text-xs font-bold text-gray-800">المنتجات</h4><span className="text-[11px] text-gray-400">{new Intl.NumberFormat("ar-SA").format(order.items.reduce((sum, item) => sum + item.quantity, 0))} قطع</span></div>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-3.5">{order.items.map((item, index) => <div key={`${order._id}-${index}`} className="flex items-start justify-between gap-3 py-3"><div className="flex min-w-0 items-start gap-2.5"><Link href={`/products/${item.slug || item.product}`} aria-label={`عرض ${item.name}`} className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 transition hover:border-gray-400">{item.image ? <img src={getProductImageUrl(item.image)} alt="" className="h-full w-full object-cover" /> : <PackageCheck size={18} className="text-gray-300" />}</Link><div className="min-w-0"><p className="text-xs font-bold text-gray-800"><Link href={`/products/${item.slug || item.product}`} className="hover:underline">{item.name}</Link><span className="mr-1.5 font-medium text-gray-400">× {item.quantity}</span></p>{item.options && Object.entries(item.options).length > 0 && <p className="mt-1 text-[10px] text-gray-500">{Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(" · ")}</p>}{item.note && <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-5 text-amber-900"><span className="font-bold">ملاحظة العميل: </span>{item.note}</p>}{item.attachments?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{item.attachments.map((attachment) => <a key={attachment.url} href={getProductImageUrl(attachment.url)} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-gray-600 transition hover:border-gray-400 hover:text-gray-900"><FileText size={13} className="shrink-0" /><span className="max-w-40 truncate">{attachment.name}</span></a>)}</div>}</div></div><span className="shrink-0 pt-0.5 text-xs font-bold text-gray-700">{formatCurrency(item.unitPrice * item.quantity)}</span></div>)}</div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-gray-100 bg-[#FCFCFB] px-5 py-4 sm:px-6"><span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">{order.paymentMethod === "visa" ? "Visa" : "الدفع عند الاستلام"}</span><div className="flex items-center gap-3"><span className="text-xs font-semibold text-gray-500">إجمالي الطلب</span><span className="text-lg font-bold text-emerald-700">{formatCurrency(order.total)}</span></div></footer>
    </article>)}
  </section>;
}
