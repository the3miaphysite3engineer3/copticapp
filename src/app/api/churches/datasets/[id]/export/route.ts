import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import { getAuthenticatedServerContext } from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedServerContext();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: datasetId } = await params;
  const supabase = createServiceRoleClient();

  // Fetch dataset
  const { data: dataset, error: datasetError } = await supabase
    .from("whisper_datasets")
    .select("*")
    .eq("id", datasetId)
    .single();

  if (datasetError || !dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  // Fetch recordings with transcriptions
  const { data: recordings } = await supabase
    .from("whisper_dataset_recordings")
    .select("*, recording:audio_recordings(*)")
    .eq("dataset_id", datasetId);

  if (!recordings || recordings.length === 0) {
    return NextResponse.json(
      { error: "No recordings in this dataset" },
      { status: 404 },
    );
  }

  // Build Whisper-compatible dataset
  const whisperData = recordings
    .filter((r) => r.recording?.transcription)
    .map((r) => ({
      audio_file: r.recording.audio_url,
      text: r.recording.transcription,
      transcription_english: r.recording.transcription_english,
      duration: r.recording.audio_duration_seconds,
      dialect: r.recording.dialect,
      language: "cop",
    }));

  return NextResponse.json(
    {
      dataset: {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description,
      },
      total_recordings: whisperData.length,
      total_duration_seconds: whisperData.reduce(
        (sum, r) => sum + (r.duration ?? 0),
        0,
      ),
      recordings: whisperData,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="whisper-dataset-${datasetId}.json"`,
      },
    },
  );
}
