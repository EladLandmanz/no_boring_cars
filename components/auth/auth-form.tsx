"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/actions/auth";

type AuthFormProps = {
  action: (
    prev: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  submitLabel: string;
  next?: string;
};

export function AuthForm({ action, submitLabel, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          type="password"
          name="password"
          autoComplete="current-password"
          minLength={6}
          required
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
