import Footer from "../components/Footer";
import Header from "../components/Header";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
import TopHeader from "../components/TopHeader";

export const metadata = { title: "إعادة تعيين كلمة المرور | الزمام" };

export default async function ResetPasswordPage({ searchParams }) {
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
