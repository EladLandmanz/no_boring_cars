"use client";

import { useActionState } from "react";
import { completeProfile } from "@/actions/auth";

export function UsernameForm({ suggested }: { suggested: string }) {
  const [state, formAction, pending] = useActionState(completeProfile, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Username
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          type="text"
          name="username"
          defaultValue={suggested.startsWith("user_") ? "" : suggested}
          autoComplete="username"
          minLength={3}
          maxLength={24}
          pattern="[a-z0-9_]{3,24}"
          required
        />
      </label>
      <p className="text-xs text-zinc-500">
        3–24 characters. Lowercase letters, numbers, and underscore. This is
        what other bidders will see.
      </p>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save username"}
      </button>
    </form>
  );
}
