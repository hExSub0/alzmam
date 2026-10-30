import { Inter } from "next/font/google";
import "./css/index.css";
import { CartProvider } from "./components/CartProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Palmera Store",
  description: "Palmera Gift & Advertising Store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} antialiased`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
