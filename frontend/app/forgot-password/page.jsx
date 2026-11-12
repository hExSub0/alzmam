import Footer from "../components/Footer";
import Header from "../components/Header";
import PasswordRecoveryForm from "../components/PasswordRecoveryForm";
import TopHeader from "../components/TopHeader";

export const metadata = { title: "نسيت كلمة المرور | زمام الجودة" };

export default function ForgotPasswordPage() {
  return (
    <>
      <TopHeader />
      <Header />
      <PasswordRecoveryForm mode="request" />
      <Footer />
    </>
  );
}
