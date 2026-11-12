import { Suspense } from "react";
import AuthPage from "../components/AuthPage";
import TopHeader from "../components/TopHeader";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = { title: "تسجيل الدخول | زمام الجودة" };

async function LoginPageContent({ searchParams }) {
  const params = await searchParams;
  const initialMessage = params?.verified === "1"
    ? "تم إنشاء الحساب وتأكيد البريد الإلكتروني. يمكنك تسجيل الدخول الآن."
    : "";

  return <>
    <TopHeader />
    <Header />
    <AuthPage mode="login" initialMessage={initialMessage} />
    <Footer />
  </>;
}

export default function LoginPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}
