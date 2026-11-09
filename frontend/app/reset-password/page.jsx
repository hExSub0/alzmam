import { Suspense } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
import TopHeader from "../components/TopHeader";

export const metadata = { title: "إعادة تعيين كلمة المرور | الزمام" };

async function ResetPasswordPageContent({ searchParams }) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";

  return (
    <>
      <TopHeader />
      <Header />
      <PasswordRecoveryForm mode="reset" token={token} />
      <Footer />
    </>
  );
}

export default function ResetPasswordPage({ searchParams }) {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent searchParams={searchParams} />
    </Suspense>
  );
}
