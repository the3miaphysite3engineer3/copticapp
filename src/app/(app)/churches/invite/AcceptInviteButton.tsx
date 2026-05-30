"use client";

import { useActionState } from "react";
import { acceptInvitationAction } from "@/actions/churches";

export function AcceptInviteButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInvitationAction, null);

  if (state?.success) {
    return (
      <div className="rounded-lg bg-green-100 p-4 text-sm text-green-800">
        <strong>Accepted!</strong> You have joined the organization.
        <div className="mt-3">
          <a
            href="/churches"
            className="bg-accent hover:bg-accent/90 inline-block rounded-lg px-6 py-2 text-sm font-medium text-white"
          >
            Go to Churches
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="mb-3 text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent hover:bg-accent/90 disabled:bg-accent/50 rounded-lg px-6 py-2 text-sm font-medium text-white"
      >
        {pending ? "Accepting..." : "Accept Invitation"}
      </button>
    </form>
  );
}
