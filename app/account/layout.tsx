import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

export default async function AccountLayout({
  children,
}: LayoutProps<"/account">) {
  const { user } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/account");
  }
  return children;
}
