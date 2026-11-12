import { Building2, Mail, Megaphone, PanelsTopLeft, Phone, Printer, Share2 } from "lucide-react";
import TopHeader from "../components/TopHeader";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = {
  title: "من نحن",
  description: "شركة زمام الجودة للدعاية والإعلان: التصميم والطباعة واللوحات والتسويق الرقمي.",
};

const services = [
  {
    icon: PanelsTopLeft,
    title: "التصميم والهوية التجارية",
    items: "الشعارات والهويات التجارية، بروفايلات الشركات، المطبوعات والكتيبات، البطاقات والأوراق الرسمية.",
  },
  {
    icon: Printer,
    title: "الطباعة والإنتاج الإعلاني",
    items: "البنرات والملصقات والاستيكرات، الفلكس والفينيل، والمطبوعات التجارية والدعائية.",
  },
  {
    icon: Building2,
    title: "اللوحات والإعلانات الخارجية",
    items: "لوحات المحلات والواجهات، اللوحات الداخلية والخارجية، اللوحات المضيئة وحروف 3D، واللوحات الإرشادية.",
  },
  {
    icon: Share2,
    title: "التسويق والإعلان الرقمي",
    items: "إدارة حسابات التواصل الاجتماعي، تصميم المحتوى، الحملات التسويقية، والمواد الترويجية الرقمية.",
  },
  {
    icon: Megaphone,
    title: "الدعاية والترويج",
    items: "الهدايا الدعائية، الحملات الترويجية، وتجهيز المواد الإعلانية بما يناسب احتياجات المشروع.",
  },
];

export default function AboutPage() {
  return (
    <>
      <TopHeader />
      <Header />
      <main dir="rtl" className="bg-[#f8f8f6] text-[#252724]">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <header className="max-w-3xl border-r-2 border-[#b69a68] pr-5 sm:pr-7">
            <p className="text-sm font-medium text-[#927849]">من نحن</p>
            <h1 className="mt-2 text-3xl font-bold leading-relaxed sm:text-4xl">زمام الجودة للدعاية والإعلان</h1>
            <p className="mt-5 text-base leading-8 text-gray-600">
              السادة المحترمون، تحية طيبة وبعد. يسرنا أن نقدم لكم شركة زمام الجودة للدعاية والإعلان، المتخصصة في تقديم الحلول الإعلانية والتسويقية ومساعدة الشركات والمؤسسات على تعزيز حضورها وبناء هوية تجارية مميزة.
            </p>
          </header>

          <section className="mt-12 sm:mt-14" aria-labelledby="services-title">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
              <h2 id="services-title" className="text-xl font-bold">خدماتنا</h2>
              <span className="hidden text-sm text-gray-400 sm:block">حلول إعلانية وتسويقية متكاملة</span>
            </div>
            <div className="divide-y divide-gray-200">
              {services.map(({ icon: Icon, title, items }) => (
                <article key={title} className="grid gap-3 py-5 sm:grid-cols-[minmax(12rem,.7fr)_1.3fr] sm:gap-8 sm:py-6">
                  <h3 className="flex items-center gap-3 text-base font-semibold">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee9df] text-[#927849]"><Icon size={18} strokeWidth={1.8} /></span>
                    {title}
                  </h3>
                  <p className="pr-12 text-sm leading-7 text-gray-600 sm:pr-0">{items}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 flex flex-col gap-5 rounded-xl border border-[#e7e2d8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7" aria-labelledby="contact-title">
            <div>
              <h2 id="contact-title" className="text-lg font-bold">يسعدنا التعاون معكم</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">تواصلوا معنا لطلب عرض يناسب متطلبات مشروعكم.</p>
            </div>
            <div className="flex flex-col items-start gap-3 text-sm sm:items-end">
              <a href="tel:+966533310314" dir="ltr" className="inline-flex items-center gap-2 text-gray-700 transition-colors hover:text-[#927849]"><Phone size={16} /> +966 53 331 0314</a>
              <a href="mailto:sales@zemam.com.sa" dir="ltr" className="inline-flex items-center gap-2 text-gray-700 transition-colors hover:text-[#927849]"><Mail size={16} /> sales@zemam.com.sa</a>
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-gray-400">شركة زمام الجودة للدعاية والإعلان · قسم المبيعات والتسويق</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
