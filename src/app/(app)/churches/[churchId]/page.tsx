import { notFound } from "next/navigation";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadChurchDashboardPageData } from "@/features/churches/lib/server/pageData";

export default async function ChurchDashboardPage({
  params,
}: {
  params: Promise<{ churchId: string }>;
}) {
  const { churchId } = await params;
  const { supabase, user } = await requireAuthenticatedPageSession(
    `/churches/${churchId}`,
  );
  const pageData = await loadChurchDashboardPageData(supabase, churchId);

  if (!pageData.church) notFound();

  const { church, organizations, transcribedRecordings } = pageData;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-start justify-between">
        <div>
          <a
            href="/churches"
            className="text-ink/50 hover:text-ink mb-2 block text-sm"
          >
            &larr; All Churches
          </a>
          <h1 className="text-3xl font-bold">{church.name}</h1>
          {church.description && (
            <p className="text-ink/60 mt-1">{church.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <a
            href={`/churches/${churchId}/organizations`}
            className="border-line hover:bg-surface/80 rounded-lg border px-4 py-2 text-sm"
          >
            Manage Organizations
          </a>
          <a
            href={`/churches/${churchId}/datasets`}
            className="bg-accent hover:bg-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Whisper Datasets
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Organizations</div>
          <div className="mt-1 text-2xl font-bold">{organizations.length}</div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Transcribed Recordings</div>
          <div className="mt-1 text-2xl font-bold">
            {transcribedRecordings.length}
          </div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Total Duration</div>
          <div className="mt-1 text-2xl font-bold">
            {formatDuration(
              transcribedRecordings.reduce(
                (sum, r) => sum + (r.audio_duration_seconds ?? 0),
                0,
              ),
            )}
          </div>
        </div>
      </div>

      {/* Organizations Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Organizations</h2>
          <a
            href={`/churches/${church.id}/organizations`}
            className="text-accent text-sm hover:underline"
          >
            View all
          </a>
        </div>
        {organizations.length === 0 ? (
          <div className="border-line rounded-lg border p-8 text-center">
            <p className="text-ink/50">
              No organizations yet. Create one to manage members and recordings.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="border-line rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{org.name}</h3>
                  <span className="bg-surface text-ink/60 rounded-full px-2 py-0.5 text-xs">
                    {org.type === "sunday_kids"
                      ? "Sunday Kids"
                      : org.type === "deacons"
                        ? "Deacons"
                        : "Other"}
                  </span>
                </div>
                <div className="text-ink/40 mt-2 flex gap-4 text-sm">
                  <span>
                    {Number((org as Record<string, unknown>).member_count) || 0} members
                  </span>
                  <span>
                    {Number((org as Record<string, unknown>).recording_count) || 0}{" "}
                    recordings
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Recordings */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Transcribed Recordings</h2>
          <span className="text-ink/40 text-sm">
            Ready for Whisper datasets
          </span>
        </div>
        {transcribedRecordings.length === 0 ? (
          <div className="border-line rounded-lg border p-8 text-center">
            <p className="text-ink/50">
              No transcribed recordings yet. Recordings with transcriptions
              appear here and can be added to Whisper datasets.
            </p>
          </div>
        ) : (
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {transcribedRecordings.slice(0, 10).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3"
              >
                <div>
                  <span className="font-medium">{rec.title}</span>
                  <span className="text-ink/40 ml-2 text-sm">
                    {rec.transcription?.slice(0, 60)}
                    {(rec.transcription?.length ?? 0) > 60 ? "..." : ""}
                  </span>
                </div>
                <span className="text-ink/40 text-xs">
                  {rec.dialect} &middot;{" "}
                  {rec.audio_duration_seconds
                    ? `${rec.audio_duration_seconds.toFixed(1)}s`
                    : "?"}
                </span>
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
  const secs = seconds % 60;
  return `${mins}m ${secs.toFixed(0)}s`;
}
