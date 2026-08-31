"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthContext, safeNextPath } from "@/lib/auth/session";

export type AuthFormState = { error: string } | null;

const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

async function getOrigin() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    redirect("/signup/check-email");
  }

  redirect("/account/username");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"), "/account");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const { profile } = await getAuthContext();
  if (!profile?.has_chosen_username) {
    redirect("/account/username");
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeProfile(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!USERNAME_RE.test(username)) {
    return {
      error: "Use 3–24 characters: lowercase letters, numbers, underscore.",
    };
  }

  const { user, profile, supabase } = await getAuthContext();
  if (!user) {
    redirect("/login?next=/account/username");
  }

  if (profile?.has_chosen_username) {
    redirect("/account");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username, has_chosen_username: true })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is taken." };
    }
    return { error: error.message };
  }

  redirect("/account");
}
