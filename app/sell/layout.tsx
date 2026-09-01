import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

export default async function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/sell");
  }
  if (!profile?.has_chosen_username) {
    redirect("/account/username");
  }
  return children;
}
