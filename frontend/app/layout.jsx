import { Inter } from "next/font/google";
import "./css/index.css";
import { CartProvider } from "./components/CartProvider";
import { AuthProvider } from "./components/AuthProvider";
import { FavoritesProvider } from "./components/FavoritesProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "زمام الجودة للدعاية والإعلان",
    template: "%s | زمام الجودة للدعاية والإعلان",
  },
  description: "زمام الجودة للدعاية والإعلان — حلول متكاملة للتصميم والطباعة والتسويق.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} antialiased`}>
      <body>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>{children}</CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
