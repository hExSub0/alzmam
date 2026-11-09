"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, Clock3, FileText, LoaderCircle, PackageCheck, Truck, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { formatCurrency } from "./CartProvider";
import { getProductImageUrl } from "../lib/productApi";

const ORDER_STEPS = [
  { label: "تم الطلب", Icon: Check },
  { label: "تم التأكيد", Icon: BadgeCheck },
  { label: "تم الشحن", Icon: Truck },
  { label: "تم التسليم", Icon: PackageCheck },
];
const STATUS_STEP = { pending: 1, confirmed: 2, shipped: 3, delivered: 3 };
const ACTIVE_STEP_LABEL = {
  pending: "بانتظار التأكيد",
  confirmed: "قيد التجهيز",
  shipped: "جاري التوصيل",
};

function OrderProgress({ status }) {
  if (status === "cancelled") return <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"><XCircle size={19} />تم إلغاء هذا الطلب</div>;
  const currentStep = STATUS_STEP[status] ?? 1;
  return <div className="rounded-2xl border border-gray-100 bg-[#FAFAFA] px-3 py-5 sm:px-6" aria-label={`حالة الطلب: ${ACTIVE_STEP_LABEL[status] || ORDER_STEPS[currentStep].label}`}>
    <ol className="grid grid-cols-4">
      {ORDER_STEPS.map(({ label: completedLabel, Icon }, index) => {
        const complete = status === "delivered" || index < currentStep;
        const active = status !== "delivered" && index === currentStep;
        const label = active ? ACTIVE_STEP_LABEL[status] || completedLabel : completedLabel;
        return <li key={label} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
          {index < ORDER_STEPS.length - 1 && <span aria-hidden="true" className={`absolute right-1/2 top-4 h-1 w-full rounded-full ${index < currentStep ? "bg-emerald-500" : index === currentStep ? "bg-gradient-to-l from-amber-400 to-gray-200" : "bg-gray-200"}`} />}
          <span className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 shadow-sm transition-colors ${complete ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-amber-500 bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-4 ring-amber-100" : "border-gray-200 bg-white text-gray-400"}`}>
            {complete ? <Check size={15} strokeWidth={3} /> : <Icon size={15} />}
          </span>
          <span className={`mt-2 text-[10px] leading-4 sm:text-xs ${complete ? "font-bold text-emerald-800" : active ? "font-bold text-amber-800" : "text-gray-400"}`}>{label}</span>
        </li>;
      })}
    </ol>
  </div>;
}

function ProductRow({ item, delivered = false }) {
  const productHref = `/products/${item.slug || item.product}`;
  return <div className={`flex items-center justify-between gap-3 py-3.5 ${delivered ? "" : "border-b border-gray-100 last:border-b-0"}`}>
    <div className="flex min-w-0 items-center gap-3">
      <Link href={productHref} aria-label={`عرض ${item.name}`} className="grid h-[68px] w-[68px] shrink-0 place-items-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition hover:border-gray-300">
        {item.image ? <img src={getProductImageUrl(item.image)} alt="" className="h-full w-full object-cover" /> : <PackageCheck size={22} className="text-gray-300" />}
      </Link>
      <div className="min-w-0">
        <Link href={productHref} className="line-clamp-2 text-sm font-semibold text-gray-800 hover:underline">{item.name}</Link>
        <p className="mt-1 text-xs text-gray-500">× {item.quantity}{item.options && Object.entries(item.options).length > 0 && <span className="mr-2">· {Object.entries(item.options).map(([label, value]) => `${label}: ${value}`).join("، ")}</span>}</p>
        {delivered && <p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(item.unitPrice * item.quantity)}</p>}
        {!delivered && <p className="mt-1 text-xs text-gray-500">سعر القطعة: {formatCurrency(item.unitPrice)}</p>}
        {item.note && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-gray-600"><span className="font-semibold">ملاحظتك: </span>{item.note}</p>}
        {item.attachments?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{item.attachments.map((attachment) => <a key={attachment.url} href={getProductImageUrl(attachment.url)} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"><FileText size={13} className="shrink-0" /><span className="max-w-36 truncate">{attachment.name}</span></a>)}</div>}
      </div>
    </div>
    {delivered ? <Link href={productHref} aria-label={`عرض ${item.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-50"><ChevronLeft size={19} /></Link> : <span className="shrink-0 text-sm font-bold text-gray-800">{formatCurrency(item.unitPrice * item.quantity)}</span>}
  </div>;
}

export default function OrdersPanel() {
  const { request } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmCancelId, setConfirmCancelId] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [cancelErrors, setCancelErrors] = useState({});

  const loadOrders = useCallback(async () => {
    try {
      const response = await request("/orders");
      setOrders(response.orders || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "تعذر تحميل الطلبات.");
    } finally {
      setIsLoading(false);
    }
  }, [request]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const cancelOrder = async (orderId) => {
    setCancellingId(orderId);
    setCancelErrors((current) => ({ ...current, [orderId]: "" }));
    try {
      const response = await request(`/orders/${orderId}/cancel`, { method: "PATCH" });
      setOrders((current) => current.map((order) => order._id === orderId ? response.order : order));
      setConfirmCancelId("");
    } catch (error) {
      setCancelErrors((current) => ({ ...current, [orderId]: error.message || "تعذر إلغاء الطلب." }));
    } finally {
      setCancellingId("");
    }
  };

  if (isLoading) return <p className="py-16 text-center text-sm text-gray-500">جارٍ تحميل الطلبات…</p>;
  if (errorMessage) return <p role="alert" className="py-12 text-center text-sm text-red-600">{errorMessage}</p>;
  if (!orders.length) return <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center"><PackageCheck size={34} className="mx-auto text-gray-300" /><p className="mt-3 font-semibold text-gray-700">لا توجد طلبات حتى الآن</p><p className="mt-1 text-sm text-gray-500">ستظهر طلباتك هنا بعد إتمام الشراء.</p></div>;

  return <div className="space-y-5" dir="rtl">
    {orders.map((order) => {
      const delivered = order.status === "delivered";
      const orderDate = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(order.createdAt));
      return <article key={order._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_4px_18px_rgba(0,0,0,0.035)]">
        {delivered ? <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFA] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white"><Check size={15} strokeWidth={3} /></span><span className="font-bold text-emerald-700">تم التسليم</span><span className="text-gray-500">في {orderDate}</span></div>
          <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200">طلب #{String(order._id).slice(-8).toUpperCase()}</span>
        </header> : <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FAFAFA] px-5 py-4 sm:px-6">
          <div><p className="text-xs font-medium text-gray-500">رقم الطلب</p><h2 className="mt-0.5 text-base font-bold tracking-wide text-gray-900" dir="ltr">#{String(order._id).slice(-8).toUpperCase()}</h2></div>
          <div className="text-left"><p className="text-xs font-medium text-gray-500">تاريخ الطلب</p><p className="mt-1 text-sm font-semibold text-gray-700">{orderDate}</p></div>
        </header>}

        {!delivered && <div className="px-4 pt-5 sm:px-6"><OrderProgress status={order.status} /></div>}

        <div className="px-5 py-5 sm:px-6">
          {!delivered && <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-800"><PackageCheck size={17} className="text-gray-500" />محتويات الطلب <span className="text-xs font-medium text-gray-400">({order.items.reduce((sum, item) => sum + item.quantity, 0)} قطع)</span></div>}
          <div className={delivered ? "divide-y divide-dashed divide-gray-200" : "divide-y divide-gray-100 rounded-xl border border-gray-100 px-4"}>
            {order.items.map((item, index) => <ProductRow key={`${order._id}-${index}`} item={item} delivered={delivered} />)}
          </div>
          <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3.5 ${delivered ? "border-t border-gray-200 bg-white" : "bg-[#F7F7F6]"}`}>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600"><Clock3 size={16} className="text-gray-400" />{order.paymentMethod === "visa" ? "الدفع ببطاقة Visa" : "الدفع عند الاستلام"}</div>
            <div className="flex items-center gap-3"><span className="text-sm font-semibold text-gray-600">الإجمالي</span><span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span></div>
          </div>
          {(order.status === "pending" || order.status === "confirmed") && <div className="mt-4 flex flex-col items-start gap-3 border-t border-gray-100 pt-4">
            {confirmCancelId === order._id ? <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">هل تريد إلغاء هذا الطلب؟ لا يمكن التراجع عن الإلغاء.</p>
              <div className="flex items-center gap-2"><button type="button" disabled={cancellingId === order._id} onClick={() => cancelOrder(order._id)} className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-3.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60">{cancellingId === order._id && <LoaderCircle size={14} className="animate-spin" />}نعم، ألغِ الطلب</button><button type="button" disabled={cancellingId === order._id} onClick={() => setConfirmCancelId("")} className="min-h-9 cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">إبقاء الطلب</button></div>
            </div> : <button type="button" onClick={() => { setConfirmCancelId(order._id); setCancelErrors((current) => ({ ...current, [order._id]: "" })); }} className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"><XCircle size={15} />إلغاء الطلب</button>}
            {cancelErrors[order._id] && <p role="alert" className="text-xs font-medium text-red-600">{cancelErrors[order._id]}</p>}
          </div>}
        </div>
      </article>;
    })}
  </div>;
}
