import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";

export default async function AccountPage() {
  const { user, profile } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (!profile?.has_chosen_username) {
    redirect("/account/username");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Account</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Signed in as <span className="font-medium">@{profile.username}</span>
      </p>
      <p className="text-sm text-zinc-500">{user.email}</p>
    </div>
  );
}
