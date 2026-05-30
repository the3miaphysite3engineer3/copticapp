"use server";

import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { getFormString } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import {
  createChurch,
  updateChurch,
  deleteChurch,
  addChurchAdmin,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createMember,
  updateMember,
  deleteMember,
  createRecording,
  updateRecording,
  deleteRecording,
  createDataset,
  updateDataset,
  deleteDataset,
  addRecordingToDataset,
  removeRecordingFromDataset,
  createFineTuningJob,
  updateFineTuningJob,
} from "@/features/churches/lib/server/queries";
import type {
  ChurchInsert,
  ChurchOrganizationInsert,
  OrganizationMemberInsert,
  AudioRecordingInsert,
  WhisperDatasetInsert,
  WhisperFineTuningJobInsert,
} from "@/features/churches/types";

// ---- Action State Types ----

export type ChurchActionState = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
} | null;

// ---- Church Actions ----

export async function createChurchAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) {
    return { success: false, error: "Service unavailable." };
  }

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const name = getFormString(formData, "name");
  const slug = getFormString(formData, "slug");
  const description = getFormString(formData, "description") || null;
  const city = getFormString(formData, "city") || null;
  const country = getFormString(formData, "country") || null;

  if (!name || !slug) {
    return { success: false, error: "Name and slug are required." };
  }

  const values: ChurchInsert = {
    name,
    slug,
    description,
    city,
    country,
    created_by: auth.user.id,
  };

  const { data, error } = await createChurch(auth.supabase, values);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A church with this slug already exists." };
    }
    return { success: false, error: error.message };
  }

  await addChurchAdmin(auth.supabase, data.id, auth.user.id, "admin");
  revalidatePath("/churches");
  return { success: true, data: { id: data.id } };
}

export async function updateChurchAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const churchId = getFormString(formData, "churchId");
  if (!churchId) return { success: false, error: "Church ID required." };

  const name = getFormString(formData, "name");
  const description = getFormString(formData, "description") || null;
  const city = getFormString(formData, "city") || null;
  const country = getFormString(formData, "country") || null;

  const { error } = await updateChurch(auth.supabase, churchId, {
    name,
    description,
    city,
    country,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches/${churchId}`);
  return { success: true };
}

export async function deleteChurchAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const churchId = getFormString(formData, "churchId");
  if (!churchId) return { success: false, error: "Church ID required." };

  const { error } = await deleteChurch(auth.supabase, churchId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/churches");
  return { success: true };
}

// ---- Organization Actions ----

export async function createOrganizationAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const churchId = getFormString(formData, "churchId");
  const name = getFormString(formData, "name");
  const slug = getFormString(formData, "slug");
  const typeRaw = getFormString(formData, "type");
  const type = typeRaw === "sunday_kids" || typeRaw === "deacons" ? typeRaw : "other";

  if (!churchId || !name || !slug) {
    return { success: false, error: "Church ID, name, and slug are required." };
  }

  const values: ChurchOrganizationInsert = {
    church_id: churchId,
    name,
    slug,
    type,
    created_by: auth.user.id,
  };

  const { data, error } = await createOrganization(auth.supabase, values);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches/${churchId}`);
  return { success: true, data: { id: data.id } };
}

export async function updateOrganizationAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const orgId = getFormString(formData, "orgId");
  const name = getFormString(formData, "name");
  const typeRaw = getFormString(formData, "type");
  const type = typeRaw === "sunday_kids" || typeRaw === "deacons" ? typeRaw : "other";

  if (!orgId) return { success: false, error: "Organization ID required." };

  const { error } = await updateOrganization(auth.supabase, orgId, { name, type });
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

export async function deleteOrganizationAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const orgId = getFormString(formData, "orgId");
  if (!orgId) return { success: false, error: "Organization ID required." };

  const { error } = await deleteOrganization(auth.supabase, orgId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

// ---- Member Actions ----

export async function createMemberAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const orgId = getFormString(formData, "orgId");
  const fullName = getFormString(formData, "fullName");
  const email = getFormString(formData, "email") || null;
  const roleRaw = getFormString(formData, "role");
  const role = roleRaw === "leader" || roleRaw === "teacher" || roleRaw === "assistant" ? roleRaw : "member";

  if (!orgId || !fullName) {
    return { success: false, error: "Organization ID and full name are required." };
  }

  const values: OrganizationMemberInsert = {
    organization_id: orgId,
    full_name: fullName,
    email,
    role,
    added_by: auth.user.id,
  };

  const { data, error } = await createMember(auth.supabase, values);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true, data: { id: data.id } };
}

export async function updateMemberAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const memberId = getFormString(formData, "memberId");
  const fullName = getFormString(formData, "fullName");
  const email = getFormString(formData, "email") || null;
  const roleRaw = getFormString(formData, "role");
  const role = roleRaw === "leader" || roleRaw === "teacher" || roleRaw === "assistant" ? roleRaw : "member";

  if (!memberId) return { success: false, error: "Member ID required." };

  const { error } = await updateMember(auth.supabase, memberId, {
    full_name: fullName,
    email,
    role,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

export async function deleteMemberAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const memberId = getFormString(formData, "memberId");
  if (!memberId) return { success: false, error: "Member ID required." };

  const { error } = await deleteMember(auth.supabase, memberId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

// ---- Recording Actions ----

export async function createRecordingAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const orgId = getFormString(formData, "orgId");
  const recordedBy = getFormString(formData, "recordedBy");
  const title = getFormString(formData, "title");
  const transcription = getFormString(formData, "transcription") || null;
  const dialectRaw = getFormString(formData, "dialect") || "B";
  const dialect = ["A", "ALL", "B", "F", "L", "M", "S"].includes(dialectRaw) ? dialectRaw as "A" | "ALL" | "B" | "F" | "L" | "M" | "S" : "B";
  const audioUrl = getFormString(formData, "audioUrl");

  if (!orgId || !recordedBy || !title || !audioUrl) {
    return { success: false, error: "Organization, recorder, title, and audio URL are required." };
  }

  const values: AudioRecordingInsert = {
    organization_id: orgId,
    recorded_by: recordedBy,
    title,
    transcription,
    dialect,
    audio_url: audioUrl,
    created_by: auth.user.id,
  };

  const { data, error } = await createRecording(auth.supabase, values);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true, data: { id: data.id } };
}

export async function updateRecordingAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const recordingId = getFormString(formData, "recordingId");
  const transcription = getFormString(formData, "transcription") || null;
  const transcriptionEnglish = getFormString(formData, "transcriptionEnglish") || null;
  const statusRaw = getFormString(formData, "status");
  const status = statusRaw === "transcribed" || statusRaw === "approved" || statusRaw === "rejected"
    ? statusRaw
    : undefined;

  if (!recordingId) return { success: false, error: "Recording ID required." };

  const { error } = await updateRecording(auth.supabase, recordingId, {
    transcription,
    transcription_english: transcriptionEnglish,
    status: status as AudioRecordingInsert["status"],
  });
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

export async function deleteRecordingAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const recordingId = getFormString(formData, "recordingId");
  if (!recordingId) return { success: false, error: "Recording ID required." };

  const { error } = await deleteRecording(auth.supabase, recordingId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

// ---- Dataset Actions ----

export async function createDatasetAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const churchId = getFormString(formData, "churchId");
  const name = getFormString(formData, "name");
  const description = getFormString(formData, "description") || null;

  if (!churchId || !name) {
    return { success: false, error: "Church ID and name are required." };
  }

  const values: WhisperDatasetInsert = {
    church_id: churchId,
    name,
    description,
    created_by: auth.user.id,
  };

  const { data, error } = await createDataset(auth.supabase, values);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches/${churchId}/datasets`);
  return { success: true, data: { id: data.id } };
}

export async function addRecordingToDatasetAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const datasetId = getFormString(formData, "datasetId");
  const recordingId = getFormString(formData, "recordingId");

  if (!datasetId || !recordingId) {
    return { success: false, error: "Dataset ID and recording ID are required." };
  }

  const { error } = await addRecordingToDataset(auth.supabase, datasetId, recordingId);
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Recording is already in this dataset." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/churches`);
  return { success: true };
}

export async function removeRecordingFromDatasetAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const datasetId = getFormString(formData, "datasetId");
  const recordingId = getFormString(formData, "recordingId");

  if (!datasetId || !recordingId) {
    return { success: false, error: "Dataset ID and recording ID are required." };
  }

  const { error } = await removeRecordingFromDataset(auth.supabase, datasetId, recordingId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/churches`);
  return { success: true };
}

// ---- Fine-Tuning Job Actions ----

export async function startFineTuningJobAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const datasetId = getFormString(formData, "datasetId");
  const modelName = getFormString(formData, "modelName") || "openai/whisper-small";
  const numEpochsRaw = getFormString(formData, "numTrainEpochs");
  const batchSizeRaw = getFormString(formData, "batchSize");

  if (!datasetId) {
    return { success: false, error: "Dataset ID is required." };
  }

  const numTrainEpochs = numEpochsRaw ? parseInt(numEpochsRaw, 10) : 3;
  const batchSize = batchSizeRaw ? parseInt(batchSizeRaw, 10) : 8;
  const learningRate = 0.0001;

  const values: WhisperFineTuningJobInsert = {
    dataset_id: datasetId,
    model_name: modelName,
    language: "cop",
    status: "pending",
    num_train_epochs: numTrainEpochs,
    batch_size: batchSize,
    learning_rate: learningRate,
    created_by: auth.user.id,
  };

  const { data, error } = await createFineTuningJob(auth.supabase, values);
  if (error) return { success: false, error: error.message };

  await updateDataset(auth.supabase, datasetId, { status: "training" });

  revalidatePath(`/churches`);
  return { success: true, data: { id: data.id } };
}
