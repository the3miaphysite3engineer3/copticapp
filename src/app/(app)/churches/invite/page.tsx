import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvitationByToken } from "@/features/churches/lib/server/queries";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { AcceptInviteButton } from "./AcceptInviteButton";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const supabase = await createClient();
  const { data: raw } = await getInvitationByToken(supabase, token);
  if (!raw) notFound();

  const invitation = raw as Record<string, unknown>;
  if ((invitation.status as string) !== "pending") {
    return (
      <div className="mx-auto max-w-lg space-y-6 p-6 text-center">
        <h1 className="text-3xl font-bold">Invitation {(invitation.status as string)}</h1>
        <p className="text-ink/60">This invitation is no longer valid.</p>
        <a href="/churches" className="text-accent hover:underline text-sm">
          &larr; Back to churches
        </a>
      </div>
    );
  }

  const auth = await getAuthenticatedServerContext();
  const userEmail = auth?.user.email?.toLowerCase();
  const inviteEmail = (invitation.email as string).toLowerCase();
  const emailMatch = auth && userEmail === inviteEmail;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-3xl font-bold">Organization Invitation</h1>
      <div className="border-line rounded-lg border p-6">
        <p className="text-lg">
          You have been invited to join{" "}
          <strong>{invitation.organization_name as string}</strong>
          {invitation.church_name ? (
            <>
              {" "}at <strong>{invitation.church_name as string}</strong>
            </>
          ) : null}.
        </p>

        {!auth ? (
          <div className="mt-6 space-y-3">
            <p className="text-ink/60 text-sm">
              Please sign in with the email address{" "}
              <strong>{invitation.email as string}</strong> to accept this
              invitation.
            </p>
            <a
              href={`/sign-in?redirect=/churches/invite?token=${token}`}
              className="bg-accent hover:bg-accent/90 inline-block rounded-lg px-6 py-2 text-sm font-medium text-white"
            >
              Sign In
            </a>
          </div>
        ) : emailMatch ? (
          <div className="mt-6">
            <AcceptInviteButton token={token} />
          </div>
        ) : (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <strong>Email mismatch.</strong> This invitation was sent to{" "}
            <strong>{invitation.email as string}</strong>, but you are signed in
            as <strong>{userEmail}</strong>. Please sign in with the correct
            email address.
          </div>
        )}
      </div>
      <a href="/churches" className="text-accent hover:underline text-sm">
        &larr; Back to churches
      </a>
    </div>
  );
}
