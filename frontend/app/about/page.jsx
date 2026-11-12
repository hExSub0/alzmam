import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, Mail, Megaphone, PanelsTopLeft, Phone, Printer, Share2, Sparkles } from "lucide-react";
import TopHeader from "../components/TopHeader";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "من نحن | زمام الجودة للدعاية والإعلان",
  description: "تعرف على زمام الجودة للدعاية والإعلان وخدمات التصميم والطباعة واللوحات والتسويق الرقمي.",
};

const services = [
  { icon: PanelsTopLeft, number: "01", title: "التصميم والهوية التجارية", items: ["تصميم الشعارات والهويات التجارية", "البروفايلات والملفات التعريفية", "المطبوعات والكتيبات والكتالوجات", "البطاقات والأوراق الرسمية"] },
  { icon: Printer, number: "02", title: "الطباعة والإنتاج الإعلاني", items: ["طباعة البنرات واللوحات الإعلانية", "الملصقات والاستيكرات", "الفلكس والفينيل", "المطبوعات التجارية والدعائية"] },
  { icon: Building2, number: "03", title: "اللوحات والإعلانات الخارجية", items: ["اللوحات الخارجية والداخلية", "لوحات المحلات والواجهات التجارية", "اللوحات المضيئة وحروف 3D", "اللوحات الإرشادية والتعريفية"] },
  { icon: Share2, number: "04", title: "التسويق والإعلان الرقمي", items: ["إدارة حسابات التواصل الاجتماعي", "تصميم المحتوى الإعلاني", "الحملات التسويقية والإعلانية", "المواد الترويجية الرقمية"] },
  { icon: Megaphone, number: "05", title: "الدعاية والترويج", items: ["تجهيز المواد والهدايا الدعائية", "الحملات الترويجية للمنتجات والخدمات", "تصميم وتنفيذ المواد الإعلانية", "حلول مصممة حسب احتياجاتكم"] },
];

const values = [
  { icon: Sparkles, title: "أفكار تصنع الفرق", text: "نحوّل أهدافكم إلى تصاميم ورسائل إعلانية تلفت الانتباه." },
  { icon: BadgeCheck, title: "جودة في كل تفصيل", text: "نهتم بجودة التنفيذ من الفكرة الأولى وحتى المنتج النهائي." },
  { icon: BriefcaseBusiness, title: "حلول متكاملة", text: "نجمع التصميم والطباعة والإعلان في تجربة واحدة سهلة." },
];

export default function AboutPage() {
  return (
    <>
      <TopHeader />
      <Header />
      <main dir="rtl" className="min-h-screen overflow-hidden bg-[#f7f7f4] text-[#202321]">
        <section className="relative isolate overflow-hidden bg-[#171a18] text-white">
          <div className="absolute -left-28 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#b69055]/20 blur-3xl" />
          <div className="absolute -bottom-48 right-1/4 h-96 w-96 rounded-full bg-emerald-900/25 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 sm:px-10 sm:py-28 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-16 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c8a66e]/35 bg-[#c8a66e]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[#dfc18e]">
                <Sparkles size={14} /> شريككم في صناعة الحضور
              </span>
              <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.35] sm:text-5xl lg:text-6xl">
                فكرتكم تستحق <span className="text-[#d1b17a]">أن تُرى.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg sm:leading-9">
                يسرنا أن نقدم لكم <strong className="font-bold text-white">شركة زمام الجودة للدعاية والإعلان</strong>، المتخصصة في الحلول الإعلانية والتسويقية المتكاملة، لمساعدة الشركات والمؤسسات على تعزيز حضورها وبناء هوية تجارية مميزة.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#services" className="inline-flex items-center gap-2 rounded-full bg-[#c5a36d] px-6 py-3.5 text-sm font-bold text-[#171a18] transition hover:bg-[#d8bb8a]">
                  اكتشفوا خدماتنا <ArrowLeft size={17} />
                </a>
                <a href="mailto:sales@zemam.com.sa" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
                  تواصلوا معنا <Mail size={16} />
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-4 rounded-[2rem] border border-[#c5a36d]/20 rotate-3" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-[#30352f] via-[#222622] to-[#171a18] p-8 shadow-2xl sm:p-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c5a36d] text-[#171a18]"><Megaphone size={30} /></div>
                <p className="mt-10 text-sm font-semibold tracking-[.18em] text-[#d1b17a]">ZEMAM QUALITY</p>
                <h2 className="mt-3 text-3xl font-black leading-relaxed">زمام الجودة<br />للدعاية والإعلان</h2>
                <div className="mt-8 h-px bg-white/15" />
                <p className="mt-5 text-sm leading-7 text-white/60">من أول فكرة، إلى آخر تفصيل… حضور علامتكم يبدأ من هنا.</p>
                <div className="absolute -bottom-10 -left-5 h-32 w-32 rounded-full border border-[#c5a36d]/20" />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-black/[.06] bg-white p-7 shadow-[0_10px_35px_rgba(20,25,20,.035)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eee4] text-[#a27c42]"><Icon size={22} /></span>
                <h2 className="mt-5 text-lg font-extrabold">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-gray-500">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold tracking-[.2em] text-[#a27c42]">ماذا نقدم</span>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">كل ما تحتاجه علامتكم، في مكان واحد</h2>
              <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">خدمات متكاملة تمنح مشاريعكم صورة متناسقة وحضوراً يليق بها.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ icon: Icon, number, title, items }) => (
                <article key={number} className="group rounded-2xl border border-gray-100 bg-[#fcfcfa] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c5a36d]/40 hover:shadow-xl hover:shadow-black/[.05] sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1ecdf] text-[#9f7a42] transition group-hover:bg-[#c5a36d] group-hover:text-white"><Icon size={22} /></span>
                    <span className="font-mono text-sm font-bold text-gray-300">{number}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-500">
                    {items.map((item) => <li key={item} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5a36d]" />{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 sm:px-10 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#202522] px-7 py-10 text-white sm:px-12 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="absolute -left-12 -top-28 h-64 w-64 rounded-full border border-white/[.06]" />
            <div className="relative max-w-2xl">
              <p className="text-xs font-bold tracking-[.2em] text-[#d1b17a]">نبدأ من احتياجكم</p>
              <h2 className="mt-3 text-2xl font-black leading-relaxed sm:text-3xl">نسعد بفرصة التعاون معكم</h2>
              <p className="mt-3 text-sm leading-7 text-white/65">تواصلوا معنا لنقدم لكم عرضاً فنياً ومالياً يناسب متطلبات مشاريعكم.</p>
            </div>
            <div className="relative mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <a href="tel:+966533310314" dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5a36d] px-5 py-3 text-sm font-bold text-[#171a18] transition hover:bg-[#d8bb8a]"><Phone size={16} /> 0533310314</a>
              <a href="mailto:sales@zemam.com.sa" dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><Mail size={16} /> sales@zemam.com.sa</a>
            </div>
          </div>
          <p className="mt-7 text-center text-xs text-gray-400">وتفضلوا بقبول فائق الاحترام والتقدير، <span className="font-semibold text-gray-600">شركة زمام الجودة للدعاية والإعلان — قسم المبيعات والتسويق</span></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
