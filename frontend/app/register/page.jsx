import AuthPage from "../components/AuthPage";
import TopHeader from "../components/TopHeader";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = { title: "إنشاء حساب | الزمام" };

export default function RegisterPage() {
  return <>
    <TopHeader />
    <Header />
    <AuthPage mode="register" />
    <Footer />
  </>;
}
