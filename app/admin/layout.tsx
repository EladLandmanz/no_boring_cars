import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (profile?.role !== "admin") {
    redirect("/");
  }
  return children;
}
