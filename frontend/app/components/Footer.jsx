import { Mail, Phone } from "lucide-react";
import CurrentYear from "./CurrentYear";

const usefulLinks = [
  { label: "الصفحة الرئيسية", href: "https://alzmam-adv.com/ar" },
  { label: "من نحن", href: "https://alzmam-adv.com/ar/about-alzmam/page-727854563" },
  { label: "أحدث المنتجات", href: "https://alzmam-adv.com/ar/latest-products" },
];

export default function Footer({ className = "mt-16" }) {
  return (
    <footer dir="rtl" className={`${className} bg-[#0e0f0f] text-white`}>
      <div className="border-b border-dashed border-white/10 bg-[#1d1f1f]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-14">
          <section className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-bold">شركة الزمام للدعاية والإعلان</h2>
            <p className="max-w-xl text-sm leading-7 text-gray-300">
              نقدّم دروعًا تذكارية وهدايا دعائية ومجسمات بتصاميم مميزة وجودة عالية، مستندين إلى خبرة تمتد لأكثر من 27 عامًا في الاستيراد والتصنيع.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold">روابط مهمة</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {usefulLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="transition-colors duration-200 hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold">تواصل معنا</h2>
            <ul className="space-y-4 text-sm text-gray-300">
              <li>
                <a href="tel:+966508504827" className="flex items-center gap-3 transition-colors duration-200 hover:text-white" dir="rtl">
                  <Phone size={17} />
                  <span dir="ltr">+966 50 850 4827</span>
                </a>
              </li>
              <li>
                <a href="mailto:alzmamadv@gmail.com" className="flex items-center gap-3 transition-colors duration-200 hover:text-white" dir="rtl">
                  <Mail size={17} />
                  <span dir="ltr">alzmamadv@gmail.com</span>
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-sm text-gray-400 sm:flex-row sm:px-6">
        <p className="break-words">جميع الحقوق محفوظة © <CurrentYear /> شركة الزمام للدعاية والإعلان</p>
        <a href="https://alzmam-adv.com/ar" className="transition-colors hover:text-white">
          alzmam-adv.com
        </a>
      </div>
    </footer>
  );
}
