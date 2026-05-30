"use client";

import { createInvitationAction } from "@/actions/churches";

export function InviteForm({ orgId, churchId }: { orgId: string; churchId: string }) {
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const result = await createInvitationAction(null, formData);
        if (result?.inviteLink) {
          try {
            await navigator.clipboard.writeText(result.inviteLink);
            alert("Invite link copied to clipboard!\n\n" + result.inviteLink);
          } catch {
            alert("Invite link:\n\n" + result.inviteLink);
          }
        } else if (result?.error) {
          alert(result.error);
        }
      }}
    >
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="churchId" value={churchId} />
      <div>
        <label htmlFor="email" className="text-ink/70 mb-1 block text-xs">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="border-line focus:border-accent w-72 rounded-lg border px-3 py-2 text-sm outline-none"
          placeholder="user@example.com"
        />
      </div>
      <button
        type="submit"
        className="bg-accent hover:bg-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        Send Invite
      </button>
    </form>
  );
}
