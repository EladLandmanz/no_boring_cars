"use client";

import { useActionState } from "react";
import {
  approveListing,
  rejectListing,
  type AdminFormState,
} from "@/actions/admin";

function ReviewForm({
  listingId,
  action,
  label,
  pendingLabel,
  confirm,
  className,
}: {
  listingId: string;
  action: (
    prev: AdminFormState,
    formData: FormData,
  ) => Promise<AdminFormState>;
  label: string;
  pendingLabel: string;
  confirm: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="flex flex-col items-end gap-1"
      onSubmit={(event) => {
        if (!window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={listingId} />
      {state?.error ? (
        <p className="max-w-48 text-right text-xs text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={className}>
        {pending ? pendingLabel : label}
      </button>
    </form>
  );
}

export function AdminReviewActions({
  listingId,
  headline,
  status,
}: {
  listingId: string;
  headline: string;
  status: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <ReviewForm
        listingId={listingId}
        action={approveListing}
        label="Approve"
        pendingLabel="Approving…"
        confirm={`Approve “${headline}” and put it on the public calendar?`}
        className="text-sm underline"
      />
      {status === "pending_review" ? (
        <ReviewForm
          listingId={listingId}
          action={rejectListing}
          label="Send back"
          pendingLabel="Sending…"
          confirm={`Send “${headline}” back to a draft?`}
          className="text-sm text-red-600 underline"
        />
      ) : null}
    </div>
  );
}
