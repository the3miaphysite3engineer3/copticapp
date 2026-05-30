"use client";

import { useActionState } from "react";

import { approveChurchRequestAction } from "@/actions/churches";
import type { ApproveRejectState } from "@/actions/churches";
import { StatusNotice } from "@/components/StatusNotice";

export function ApproveChurchRequestForm({
  requestId,
}: {
  requestId: string;
}) {
  const [state, formAction] = useActionState<ApproveRejectState, FormData>(
    approveChurchRequestAction,
    null,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <button
        type="submit"
        name="action"
        value="approve"
        className="bg-accent hover:bg-accent/90 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
      >
        Approve
      </button>
      {state?.error ? (
        <StatusNotice tone="error" className="mt-2">
          {state.error}
        </StatusNotice>
      ) : null}
    </form>
  );
}
