"use server";

import { getAuthenticatedServerContext } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseRuntimeEnv, hasSupabaseRuntimeEnv } from "@/lib/supabase/config";
import { getFormString } from "@/lib/validation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createChurch,
  getChurchBySlug,
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
  createChurchRequest,
  getChurchRequestById,
  getChurchRequestByToken,
  getAllChurchRequests,
  updateChurchRequest,
  getOrganizationsByChurch,
  createOrganization as createOrgQuery,
  createMember as createMemberQuery,
  createRecording as createRecordingQuery,
  addRecordingToDataset as addRecToDatasetQuery,
  getOrganizationById,
  createInvitation,
  getInvitationsByOrganization,
  updateInvitation,
} from "@/features/churches/lib/server/queries";
import type {
  ChurchInsert,
  ChurchOrganizationInsert,
  OrganizationMemberInsert,
  AudioRecordingInsert,
  WhisperDatasetInsert,
  WhisperFineTuningJobInsert,
  ChurchRequestInsert,
  OrganizationInvitationInsert,
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

  if (error || !data) {
    if (error?.code === "23505") {
      return { success: false, error: "A church with this slug already exists." };
    }
    return { success: false, error: error?.message ?? "Failed to create church." };
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
  if (error || !data) return { success: false, error: error?.message ?? "Failed to create organization." };

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
  if (error || !data) return { success: false, error: error?.message ?? "Failed to create member." };

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
  if (error || !data) return { success: false, error: error?.message ?? "Failed to create recording." };

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
  if (error || !data) return { success: false, error: error?.message ?? "Failed to create dataset." };

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
  if (error || !data) return { success: false, error: error?.message ?? "Failed to start fine-tuning job." };

  await updateDataset(auth.supabase, datasetId, { status: "training" });

  revalidatePath(`/churches`);
  return { success: true, data: { id: data.id } };
}

// ---- Church Request Actions ----

export type ChurchRequestActionState = {
  success: boolean;
  error?: string;
  confirmationToken?: string;
  confirmationUrl?: string;
} | null;

export async function submitChurchRequestAction(
  _prevState: ChurchRequestActionState,
  formData: FormData,
): Promise<ChurchRequestActionState> {
  if (!hasSupabaseRuntimeEnv()) {
    return { success: false, error: "Service unavailable." };
  }

  const name = getFormString(formData, "name");
  const slug = getFormString(formData, "slug");
  const description = getFormString(formData, "description") || null;
  const city = getFormString(formData, "city") || null;
  const country = getFormString(formData, "country") || null;
  const requesterName = getFormString(formData, "requesterName");
  const requesterEmail = getFormString(formData, "requesterEmail");
  const facebookPageUrl = getFormString(formData, "facebookPageUrl");

  if (!name || !slug || !requesterName || !requesterEmail || !facebookPageUrl) {
    return { success: false, error: "All required fields must be filled." };
  }

  const supabase = await createClient();

  const values: ChurchRequestInsert = {
    name,
    slug,
    description,
    city,
    country,
    requester_name: requesterName,
    requester_email: requesterEmail,
    facebook_page_url: facebookPageUrl,
  };

  const created = await createChurchRequest(supabase, values);
  if (created.error) {
    if (created.error.code === "23505") {
      return { success: false, error: "A church with this slug already exists or this request was already submitted." };
    }
    return { success: false, error: created.error.message ?? "Failed to submit request." };
  }
  if (!created.data) {
    return { success: false, error: "Failed to submit request." };
  }

  const host = (await headers()).get("host") ?? "coptic-compass.com";
  const protocol = host === "localhost" || host.startsWith("localhost") ? "http" : "https";
  const confirmationUrl = `${protocol}://${host}/churches/confirm?token=${created.data.confirmation_token}`;

  return {
    success: true,
    confirmationToken: created.data.confirmation_token,
    confirmationUrl,
  };
}

// ---- Approve / Reject Church Request Actions ----

export type ApproveRejectState = { success: boolean; error?: string } | null;

export async function approveChurchRequestAction(
  _prevState: ApproveRejectState,
  formData: FormData,
): Promise<ApproveRejectState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const profile = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();
  if (profile.data?.role !== "admin") return { success: false, error: "Not authorized." };

  const requestId = getFormString(formData, "requestId");
  const action = getFormString(formData, "action");
  if (!requestId) return { success: false, error: "Request ID required." };

  const { data: request } = await getChurchRequestById(auth.supabase, requestId);
  if (!request) return { success: false, error: "Request not found." };

  if (action === "approve") {
    const { data: church, error: createError } = await createChurch(auth.supabase, {
      name: request.name,
      slug: request.slug,
      description: request.description,
      city: request.city,
      country: request.country,
      created_by: auth.user.id,
    });

    let resolvedChurch = church;

    if (!resolvedChurch) {
      if (createError?.code === "23505") {
        const existing = await getChurchBySlug(auth.supabase, request.slug);
        if (existing.data) {
          resolvedChurch = existing.data;
        } else {
          return { success: false, error: `Slug conflict but couldn't find existing church: ${createError.message}` };
        }
      } else {
        return { success: false, error: createError?.message ?? "Failed to create church." };
      }
    }

    if (!resolvedChurch) return { success: false, error: "Failed to create church." };
    const { error: adminError } = await addChurchAdmin(auth.supabase, resolvedChurch.id, auth.user.id, "admin");
    if (adminError) {
      return { success: false, error: `Failed to add admin: ${adminError.message} (${adminError.code ?? "no code"})` };
    }

    const { error } = await updateChurchRequest(auth.supabase, requestId, {
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: auth.user.id,
    });
    if (error) return { success: false, error: error.message };

    revalidatePath("/churches");
    return { success: true };
  }

  const { error } = await updateChurchRequest(auth.supabase, requestId, {
    status: "rejected",
    rejected_at: new Date().toISOString(),
    rejected_by: auth.user.id,
  });
  if (error) return { success: false, error: error.message };

  revalidatePath("/churches");
  return { success: true };
}

// ---- Organization Invitation Actions ----

export type InvitationActionState = {
  success: boolean;
  error?: string;
  inviteLink?: string;
  data?: Record<string, unknown>;
} | null;

export async function createInvitationAction(
  _prevState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const orgId = getFormString(formData, "orgId");
  const email = getFormString(formData, "email");
  const churchId = getFormString(formData, "churchId");

  if (!orgId || !email) {
    return { success: false, error: "Organization ID and email are required." };
  }

  const values: OrganizationInvitationInsert = {
    organization_id: orgId,
    email,
    invited_by: auth.user.id,
  };

  const { data: raw, error } = await createInvitation(auth.supabase, values);
  if (error || !raw) return { success: false, error: error?.message ?? "Failed to create invitation." };

  const inv = raw as unknown as { id: string; token: string };
  const host = (await headers()).get("host") ?? "coptic-compass.com";
  const protocol = host === "localhost" || host.startsWith("localhost") ? "http" : "https";
  const inviteLink = `${protocol}://${host}/churches/invite?token=${inv.token}`;

  revalidatePath(`/churches/${churchId}/organizations/${orgId}`);
  return { success: true, inviteLink, data: { id: inv.id } };
}

export async function acceptInvitationAction(
  _prevState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const token = getFormString(formData, "token");
  if (!token) return { success: false, error: "Token is required." };

  const supabase = await createClient();
  const { data, error } = await (supabase.rpc as any)("accept_invitation", { p_token: token });
  if (error) return { success: false, error: error.message };

  const result = data as Record<string, unknown> | null;
  if (!result) return { success: false, error: "Failed to accept invitation." };
  if (result.error) return { success: false, error: result.error as string };

  return { success: true, data: result };
}

// ---- TTS to Dataset Action ----

export async function addTtsRecordingToDatasetAction(
  _prevState: ChurchActionState,
  formData: FormData,
): Promise<ChurchActionState> {
  if (!hasSupabaseRuntimeEnv()) return { success: false, error: "Service unavailable." };

  const auth = await getAuthenticatedServerContext();
  if (!auth) return { success: false, error: "Please sign in first." };

  const datasetId = getFormString(formData, "datasetId");
  const orgId = getFormString(formData, "orgId");
  const copticText = getFormString(formData, "copticText");
  const englishText = getFormString(formData, "englishText") || null;

  if (!datasetId || !orgId || !copticText) {
    return { success: false, error: "Dataset, organization, and Coptic text are required." };
  }

  try {
    const { getPremiumAudio } = await import("@/actions/tts");
    const { uploadToCloudinary } = await import("@/lib/cloudinary");

    const audioResult = await getPremiumAudio(copticText, "f_coptic_standard", 0);
    const audioBuffer = Buffer.from(audioResult.base64Audio, "base64");
    const uploadResult = await uploadToCloudinary(audioBuffer, `tts-${Date.now()}.${audioResult.mimeType === "audio/wav" ? "wav" : "mp3"}`);

    const { data: org } = await getOrganizationById(auth.supabase, orgId);
    if (!org) return { success: false, error: "Organization not found." };

    const { data: ttsMember } = await createMemberQuery(auth.supabase, {
      organization_id: orgId,
      full_name: "TTS Generator",
      role: "member",
      added_by: auth.user.id,
    });
    if (!ttsMember) return { success: false, error: "Failed to create TTS member reference." };

    const { data: recording } = await createRecordingQuery(auth.supabase, {
      organization_id: orgId,
      recorded_by: ttsMember.id,
      title: `TTS: ${copticText.slice(0, 60)}`,
      transcription: copticText,
      transcription_english: englishText,
      dialect: "B",
      audio_url: uploadResult.url,
      audio_duration_seconds: null,
      file_size_bytes: uploadResult.bytes,
      file_format: uploadResult.format,
      status: "transcribed",
      created_by: auth.user.id,
    });
    if (!recording) return { success: false, error: "Failed to create recording." };

    const { error: linkError } = await addRecToDatasetQuery(auth.supabase, datasetId, recording.id);
    if (linkError) return { success: false, error: linkError.message };

    revalidatePath(`/churches`);
    return { success: true, data: { id: recording.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate TTS recording.";
    return { success: false, error: message };
  }
}
