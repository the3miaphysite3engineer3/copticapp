import { notFound } from "next/navigation";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadDatasetDetailPageData } from "@/features/churches/lib/server/pageData";
import { getOrganizationsByChurch } from "@/features/churches/lib/server/queries";
import { AddTtsRecordingForm } from "@/features/churches/components/AddTtsRecordingForm";

export default async function DatasetDetailPage({
  params,
}: {
  params: Promise<{ churchId: string; datasetId: string }>;
}) {
  const { churchId, datasetId } = await params;
  const { supabase, user } = await requireAuthenticatedPageSession(
    `/churches/${churchId}/datasets/${datasetId}`,
  );

  const pageData = await loadDatasetDetailPageData(supabase, datasetId);
  if (!pageData.dataset) notFound();

  const { dataset, recordings, jobs } = pageData;
  const { data: organizations } = await getOrganizationsByChurch(supabase, churchId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <a
          href={`/churches/${churchId}/datasets`}
          className="text-ink/50 hover:text-ink mb-2 block text-sm"
        >
          &larr; All Datasets
        </a>
        <h1 className="text-3xl font-bold">{dataset.name}</h1>
        {dataset.description && (
          <p className="text-ink/60 mt-1">{dataset.description}</p>
        )}
      </div>

      {/* Dataset Stats & Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Status</div>
          <div className="mt-1 font-semibold capitalize">{dataset.status}</div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Recordings</div>
          <div className="mt-1 text-2xl font-bold">
            {dataset.total_recordings}
          </div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Total Duration</div>
          <div className="mt-1 text-2xl font-bold">
            {formatDuration(dataset.total_duration_seconds)}
          </div>
        </div>
        <div className="border-line rounded-lg border p-4">
          <div className="text-ink/50 text-sm">Fine-Tuning Jobs</div>
          <div className="mt-1 text-2xl font-bold">{jobs.length}</div>
        </div>
      </div>

      {dataset.huggingface_dataset_id && (
        <div className="bg-surface rounded-lg p-4 text-sm">
          Hugging Face Dataset:{" "}
          <a
            href={`https://huggingface.co/datasets/${dataset.huggingface_dataset_id}`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {dataset.huggingface_dataset_id}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <form>
          <button
            formAction={async (formData: FormData) => {
              "use server";
              const { startFineTuningJobAction } = await import(
                "@/actions/churches"
              );
              formData.set("datasetId", datasetId);
              await startFineTuningJobAction(null, formData);
            }}
            className="bg-accent hover:bg-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={recordings.length === 0}
          >
            Start Fine-Tuning
          </button>
        </form>
        <a
          href={`/api/churches/datasets/${datasetId}/export`}
          className="border-line hover:bg-surface/80 rounded-lg border px-4 py-2 text-sm"
        >
          Export Dataset (JSON)
        </a>
      </div>

      {/* TTS Generation */}
      {organizations && organizations.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Generate TTS Recording</h2>
          <div className="border-line rounded-lg border p-4">
            <p className="text-ink/50 mb-3 text-sm">
              Type Coptic text to synthesize speech and add it directly to this
              dataset.
            </p>
            <AddTtsRecordingForm
              churchId={churchId}
              datasetId={datasetId}
              organizations={organizations.map((o) => ({
                id: o.id,
                name: o.name,
              }))}
            />
          </div>
        </section>
      )}

      {/* Recordings in Dataset */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Recordings ({recordings.length})
        </h2>
        {recordings.length === 0 ? (
          <div className="border-line rounded-lg border p-8 text-center">
            <p className="text-ink/50">
              No recordings in this dataset. Add transcribed recordings from
              your organizations.
            </p>
          </div>
        ) : (
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {recordings.map((item) => {
              const rec = item.recording;
              if (!rec) return null;
              return (
                <div key={item.recording_id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{rec.title}</span>
                      {rec.transcription && (
                        <p className="text-ink/50 mt-0.5 text-sm line-clamp-1">
                          {rec.transcription}
                        </p>
                      )}
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
                            : "bg-surface text-ink/60"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Fine-Tuning Jobs */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Fine-Tuning Jobs ({jobs.length})
        </h2>
        {jobs.length === 0 ? (
          <div className="border-line rounded-lg border p-8 text-center">
            <p className="text-ink/50">
              No fine-tuning jobs yet. Create one to start training.
            </p>
          </div>
        ) : (
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {jobs.map((job) => (
              <div key={job.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{job.model_name}</span>
                    <span className="text-ink/40 ml-2 text-sm">
                      {job.language}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : job.status === "training"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-surface text-ink/60"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="text-ink/40 mt-2 grid grid-cols-3 gap-4 text-xs">
                  <span>Epochs: {job.num_train_epochs ?? "?"}</span>
                  <span>Batch: {job.batch_size ?? "?"}</span>
                  <span>LR: {job.learning_rate ?? "?"}</span>
                </div>
                {job.trained_model_id && (
                  <div className="mt-2 text-xs">
                    Model:{" "}
                    <a
                      href={`https://huggingface.co/${job.trained_model_id}`}
                      className="text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {job.trained_model_id}
                    </a>
                  </div>
                )}
                {job.error && (
                  <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                    Error: {job.error}
                  </div>
                )}
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
