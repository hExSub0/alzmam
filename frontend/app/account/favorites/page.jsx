import AccountLayout from "../../components/AccountLayout";
import FavoritesPanel from "../../components/FavoritesPanel";

export default function AccountFavoritesPage() {
  return (
    <AccountLayout activeSection="favorites" title="قائمة الأمنيات">
      <FavoritesPanel />
    </AccountLayout>
  );
}
