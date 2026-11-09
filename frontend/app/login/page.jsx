import AuthPage from "../components/AuthPage";
import TopHeader from "../components/TopHeader";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = { title: "تسجيل الدخول | الزمام" };

export default function LoginPage() {
  return <>
    <TopHeader />
    <Header />
    <AuthPage mode="login" />
    <Footer />
  </>;
}
