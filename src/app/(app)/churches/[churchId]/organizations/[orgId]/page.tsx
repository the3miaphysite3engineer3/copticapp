import { notFound } from "next/navigation";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadOrganizationPageData } from "@/features/churches/lib/server/pageData";
import { InviteForm } from "./InviteForm";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ churchId: string; orgId: string }>;
}) {
  const { churchId, orgId } = await params;
  const { supabase, user } = await requireAuthenticatedPageSession(
    `/churches/${churchId}/organizations/${orgId}`,
  );

  const pageData = await loadOrganizationPageData(supabase, orgId);
  if (!pageData.organization) notFound();

  const { organization: org, recordings } = pageData;
  const members = pageData.members as Array<Record<string, unknown>>;
  const invitations = pageData.invitations as Array<Record<string, unknown>>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <a
          href={`/churches/${churchId}/organizations`}
          className="text-ink/50 hover:text-ink mb-2 block text-sm"
        >
          &larr; All Organizations
        </a>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <span className="bg-surface text-ink/60 rounded-full px-3 py-1 text-sm">
            {org.type === "sunday_kids"
              ? "Sunday Kids"
              : org.type === "deacons"
                ? "Deacons"
                : "Other"}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Members</div>
          <div className="mt-1 text-2xl font-bold">{members.length}</div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Recordings</div>
          <div className="mt-1 text-2xl font-bold">{recordings.length}</div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Recording Duration</div>
          <div className="mt-1 text-2xl font-bold">
            {formatDuration(
              recordings.reduce(
                (sum, r) => sum + (r.audio_duration_seconds ?? 0),
                0,
              ),
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Members ({members.length})</h2>
        </div>
        <div className="border-line rounded-lg border p-6">
          <h3 className="mb-4 text-sm font-medium">Invite Member</h3>
          <InviteForm orgId={orgId} churchId={churchId} />
        </div>
        {invitations.length > 0 && (
          <div className="border-line divide-line mt-4 divide-y overflow-hidden rounded-lg border">
            <div className="bg-surface px-3 py-2 text-xs font-medium text-ink/50">
              Pending Invitations
            </div>
            {invitations.map((inv) => (
              <div key={inv.id as string} className="flex items-center justify-between p-3">
                <div>
                  <span className="font-medium">{inv.email as string}</span>
                  <span className="text-ink/40 ml-2 text-xs">
                    {inv.status as string} &middot; invited{" "}
                    {new Date(inv.created_at as string).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {members.length > 0 && (
          <div className="border-line divide-line mt-4 divide-y overflow-hidden rounded-lg border">
            {members.map((member) => (
              <div
                key={member.id as string}
                className="flex items-center justify-between p-3"
              >
                <div>
                  <span className="font-medium">
                    {(member as any).profile?.full_name ?? member.full_name as string}
                  </span>
                  <span className="text-ink/40 ml-2 text-sm">
                    {member.role as string}
                  </span>
                  {member.email ? (
                    <span className="text-ink/40 ml-2 text-sm">
                      &middot; {member.email as string}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recordings */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Recordings ({recordings.length})
          </h2>
        </div>
        {recordings.length === 0 ? (
          <div className="border-line rounded-lg border p-8 text-center">
            <p className="text-ink/50">
              No recordings yet. Record deacons speaking Coptic to build your
              Whisper dataset.
            </p>
          </div>
        ) : (
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {recordings.map((rec) => (
              <div key={rec.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{rec.title}</span>
                    <span className="text-ink/40 ml-2 text-xs">
                      by {rec.recorded_by?.full_name ?? "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-ink/40 text-xs">
                      {rec.dialect} &middot;{" "}
                      {rec.audio_duration_seconds
                        ? `${rec.audio_duration_seconds.toFixed(1)}s`
                        : "?"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        rec.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : rec.status === "transcribed"
                            ? "bg-blue-100 text-blue-700"
                            : rec.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-surface text-ink/60"
                      }`}
                    >
                      {rec.status}
                    </span>
                  </div>
                </div>
                {rec.transcription && (
                  <p className="text-ink/50 mt-1 text-sm">
                    {rec.transcription.slice(0, 200)}
                    {rec.transcription.length > 200 ? "..." : ""}
                  </p>
                )}
                <audio
                  src={rec.audio_url}
                  controls
                  className="mt-2 h-8 w-full"
                  preload="none"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${(seconds % 60).toFixed(0)}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
