import { redirect } from "next/navigation";
import { UsernameForm } from "@/components/auth/username-form";
import { getAuthContext } from "@/lib/auth/session";

export default async function UsernamePage() {
  const { user, profile } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/account/username");
  }
  if (profile?.has_chosen_username) {
    redirect("/account");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">Choose a username</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        You got a placeholder handle at signup. Pick the name other bidders
        will see. You cannot bid until this is done.
      </p>
      <UsernameForm suggested={profile?.username ?? ""} />
    </div>
  );
}
