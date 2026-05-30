import { notFound } from "next/navigation";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadDatasetsPageData } from "@/features/churches/lib/server/pageData";

export default async function DatasetsPage({
  params,
}: {
  params: Promise<{ churchId: string }>;
}) {
  const { churchId } = await params;
  const { supabase, user } = await requireAuthenticatedPageSession(
    `/churches/${churchId}/datasets`,
  );

  const pageData = await loadDatasetsPageData(supabase, churchId);
  if (!pageData.church) notFound();

  const { church, datasets } = pageData;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <a
          href={`/churches/${churchId}`}
          className="text-ink/50 hover:text-ink mb-2 block text-sm"
        >
          &larr; {church.name}
        </a>
        <h1 className="text-3xl font-bold">Whisper Datasets</h1>
        <p className="text-ink/60 mt-1">
          Collections of transcribed Coptic recordings for fine-tuning Whisper
          speech recognition
        </p>
      </div>

      <div className="border-line rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Create Dataset</h2>
        <DatasetForm churchId={churchId} />
      </div>

      <div className="space-y-4">
        {datasets.length === 0 ? (
          <div className="border-line rounded-lg border p-12 text-center">
            <p className="text-ink/50">No datasets yet.</p>
            <p className="text-ink/40 mt-1 text-sm">
              Create a dataset, add transcribed recordings, and then start a
              Whisper fine-tuning job.
            </p>
          </div>
        ) : (
          datasets.map((ds) => (
            <a
              key={ds.id}
              href={`/churches/${churchId}/datasets/${ds.id}`}
              className="border-line hover:border-ink/30 block rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{ds.name}</h3>
                  {ds.description && (
                    <p className="text-ink/60 mt-0.5 text-sm">
                      {ds.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-ink/40 text-xs">
                    {ds.total_recordings} recordings
                    {ds.total_duration_seconds > 0
                      ? ` \u00B7 ${formatDuration(ds.total_duration_seconds)}`
                      : ""}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      ds.status === "ready"
                        ? "bg-green-100 text-green-700"
                        : ds.status === "training"
                          ? "bg-blue-100 text-blue-700"
                          : ds.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-surface text-ink/60"
                    }`}
                  >
                    {ds.status}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

function DatasetForm({ churchId }: { churchId: string }) {
  return (
    <form className="space-y-4">
      <input type="hidden" name="churchId" value={churchId} />
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-ink/70 mb-1 block text-sm">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="border-line focus:border-accent w-full rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="e.g. Bohairic Deacon Dataset v1"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="text-ink/70 mb-1 block text-sm"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            className="border-line focus:border-accent w-full rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="Optional description"
          />
        </div>
      </div>
      <button
        formAction={async (formData: FormData) => {
          "use server";
          const { createDatasetAction } = await import(
            "@/actions/churches"
          );
          await createDatasetAction(null, formData);
        }}
        className="bg-accent hover:bg-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        Create Dataset
      </button>
    </form>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ${(seconds % 60).toFixed(0)}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}
