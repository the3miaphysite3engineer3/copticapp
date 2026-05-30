import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChurchRequestByToken, updateChurchRequest } from "@/features/churches/lib/server/queries";

export default async function ChurchConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const supabase = await createClient();
  const { data: request } = await getChurchRequestByToken(supabase, token);
  if (!request) notFound();

  if (request.status === "approved") {
    redirect("/churches");
  }

  if (request.status === "pending") {
    await updateChurchRequest(supabase, request.id, {
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Request Confirmed</h1>
      <div className="border-line rounded-lg border p-6">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 text-2xl">
          &#10003;
        </div>
        <p className="text-lg">
          Thank you! The request for <strong>{request.name}</strong> has been
          confirmed.
        </p>
        <p className="text-ink/60 mt-2">
          The Coptic Compass team will review your request shortly. Once
          approved, you will be able to set up organizations, manage members, and
          record Coptic audio for Whisper fine-tuning.
        </p>
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Status:</strong> Confirmed &mdash; awaiting admin approval.
        </div>
      </div>
      <a href="/churches" className="text-accent hover:underline text-sm">
        &larr; Back to churches
      </a>
    </div>
  );
}
