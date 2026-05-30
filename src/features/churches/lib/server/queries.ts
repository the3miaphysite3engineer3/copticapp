import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import type {
  ChurchInsert,
  ChurchUpdate,
  ChurchOrganizationInsert,
  ChurchOrganizationUpdate,
  ChurchRequestInsert,
  ChurchRequestUpdate,
  OrganizationMemberInsert,
  OrganizationMemberUpdate,
  OrganizationInvitationInsert,
  OrganizationInvitationUpdate,
  AudioRecordingInsert,
  AudioRecordingUpdate,
  WhisperDatasetInsert,
  WhisperDatasetUpdate,
  WhisperFineTuningJobInsert,
  WhisperFineTuningJobUpdate,
} from "@/features/churches/types";

// ---- Churches ----

export async function createChurch(
  supabase: AppSupabaseClient,
  values: ChurchInsert,
) {
  const { data, error } = await supabase
    .from("churches")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getChurchById(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data, error } = await supabase
    .from("churches")
    .select("*, church_admins(*)")
    .eq("id", churchId)
    .single();
  return { data, error };
}

export async function getChurchBySlug(
  supabase: AppSupabaseClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from("churches")
    .select("*, church_admins(*)")
    .eq("slug", slug)
    .single();
  return { data, error };
}

export async function getUserChurches(
  supabase: AppSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("churches")
    .select("*, church_admins!inner(*)")
    .eq("church_admins.user_id", userId);
  return { data, error };
}

export async function getUserChurchesViaMembership(
  supabase: AppSupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("churches")
    .select(`
      *,
      organizations:church_organizations!inner(
        members:organization_members!inner(*)
      )
    `)
    .eq("organizations.members.user_id", userId);
  return { data, error };
}

export async function getPendingInvitationsByEmail(
  supabase: AppSupabaseClient,
  email: string,
) {
  const { data, error } = await (supabase as any)
    .from("organization_invitations")
    .select("*, organization:organization_id(name)")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return { data: data as any[] | null, error };
}

export async function updateChurch(
  supabase: AppSupabaseClient,
  churchId: string,
  values: ChurchUpdate,
) {
  const { data, error } = await supabase
    .from("churches")
    .update(values)
    .eq("id", churchId)
    .select()
    .single();
  return { data, error };
}

export async function deleteChurch(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { error } = await supabase
    .from("churches")
    .delete()
    .eq("id", churchId);
  return { error };
}

export async function addChurchAdmin(
  _supabase: AppSupabaseClient,
  churchId: string,
  userId: string,
  role: "admin" | "editor" | "viewer" = "admin",
) {
  const { createServiceRoleClient } = await import("@/lib/supabase/serviceRole");
  const sb = createServiceRoleClient();
  const { error } = await sb
    .from("church_admins")
    .insert({ church_id: churchId, user_id: userId, role });
  return { data: null, error };
}

export async function getChurchAdmins(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data, error } = await supabase
    .from("church_admins")
    .select("*, profiles!inner(*)")
    .eq("church_id", churchId);
  return { data, error };
}

// ---- Organizations ----

export async function createOrganization(
  supabase: AppSupabaseClient,
  values: ChurchOrganizationInsert,
) {
  const { data, error } = await supabase
    .from("church_organizations")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getOrganizationsByChurch(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data, error } = await supabase
    .from("church_organizations")
    .select(
      `
      *,
      member_count:organization_members(count),
      recording_count:audio_recordings(count)
    `,
    )
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getOrganizationById(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { data, error } = await supabase
    .from("church_organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  return { data, error };
}

export async function updateOrganization(
  supabase: AppSupabaseClient,
  orgId: string,
  values: ChurchOrganizationUpdate,
) {
  const { data, error } = await supabase
    .from("church_organizations")
    .update(values)
    .eq("id", orgId)
    .select()
    .single();
  return { data, error };
}

export async function deleteOrganization(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { error } = await supabase
    .from("church_organizations")
    .delete()
    .eq("id", orgId);
  return { error };
}

// ---- Organization Members ----

export async function createMember(
  supabase: AppSupabaseClient,
  values: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .insert(values as any)
    .select()
    .single();
  return { data, error };
}

export async function getMembersByOrganization(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { data, error } = await (supabase as any)
    .from("organization_members")
    .select("*, profile:user_id(full_name, email, avatar_url)")
    .eq("organization_id", orgId)
    .order("full_name", { ascending: true });
  return { data: data as any[] | null, error };
}

export async function getMemberById(
  supabase: AppSupabaseClient,
  memberId: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("id", memberId)
    .single();
  return { data, error };
}

export async function updateMember(
  supabase: AppSupabaseClient,
  memberId: string,
  values: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .update(values as any)
    .eq("id", memberId)
    .select()
    .single();
  return { data, error };
}

export async function deleteMember(
  supabase: AppSupabaseClient,
  memberId: string,
) {
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("id", memberId);
  return { error };
}

// ---- Audio Recordings ----

export async function createRecording(
  supabase: AppSupabaseClient,
  values: AudioRecordingInsert,
) {
  const { data, error } = await supabase
    .from("audio_recordings")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getRecordingsByOrganization(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { data, error } = await supabase
    .from("audio_recordings")
    .select("*, recorded_by:organization_members!inner(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getRecordingById(
  supabase: AppSupabaseClient,
  recordingId: string,
) {
  const { data, error } = await supabase
    .from("audio_recordings")
    .select("*, recorded_by:organization_members!inner(*)")
    .eq("id", recordingId)
    .single();
  return { data, error };
}

export async function updateRecording(
  supabase: AppSupabaseClient,
  recordingId: string,
  values: AudioRecordingUpdate,
) {
  const { data, error } = await supabase
    .from("audio_recordings")
    .update(values)
    .eq("id", recordingId)
    .select()
    .single();
  return { data, error };
}

export async function deleteRecording(
  supabase: AppSupabaseClient,
  recordingId: string,
) {
  const { error } = await supabase
    .from("audio_recordings")
    .delete()
    .eq("id", recordingId);
  return { error };
}

export async function getRecordingsWithTranscription(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data, error } = await supabase
    .from("audio_recordings")
    .select(
      `
      *,
      organization:church_organizations!inner(*)
    `,
    )
    .not("transcription", "is", null)
    .eq("organization.church_id", churchId)
    .in("status", ["transcribed", "approved"]);
  return { data, error };
}

// ---- Whisper Datasets ----

export async function createDataset(
  supabase: AppSupabaseClient,
  values: WhisperDatasetInsert,
) {
  const { data, error } = await supabase
    .from("whisper_datasets")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getDatasetsByChurch(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data, error } = await supabase
    .from("whisper_datasets")
    .select("*")
    .eq("church_id", churchId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getDatasetById(
  supabase: AppSupabaseClient,
  datasetId: string,
) {
  const { data, error } = await supabase
    .from("whisper_datasets")
    .select("*, recordings:whisper_dataset_recordings(*)")
    .eq("id", datasetId)
    .single();
  return { data, error };
}

export async function updateDataset(
  supabase: AppSupabaseClient,
  datasetId: string,
  values: WhisperDatasetUpdate,
) {
  const { data, error } = await supabase
    .from("whisper_datasets")
    .update(values)
    .eq("id", datasetId)
    .select()
    .single();
  return { data, error };
}

export async function deleteDataset(
  supabase: AppSupabaseClient,
  datasetId: string,
) {
  const { error } = await supabase
    .from("whisper_datasets")
    .delete()
    .eq("id", datasetId);
  return { error };
}

export async function addRecordingToDataset(
  supabase: AppSupabaseClient,
  datasetId: string,
  recordingId: string,
) {
  const { data, error } = await supabase
    .from("whisper_dataset_recordings")
    .insert({ dataset_id: datasetId, recording_id: recordingId })
    .select()
    .single();
  return { data, error };
}

export async function removeRecordingFromDataset(
  supabase: AppSupabaseClient,
  datasetId: string,
  recordingId: string,
) {
  const { error } = await supabase
    .from("whisper_dataset_recordings")
    .delete()
    .eq("dataset_id", datasetId)
    .eq("recording_id", recordingId);
  return { error };
}

export async function getDatasetRecordings(
  supabase: AppSupabaseClient,
  datasetId: string,
) {
  const { data, error } = await supabase
    .from("whisper_dataset_recordings")
    .select("*, recording:audio_recordings(*)")
    .eq("dataset_id", datasetId);
  return { data, error };
}

// ---- Whisper Fine Tuning Jobs ----

export async function createFineTuningJob(
  supabase: AppSupabaseClient,
  values: WhisperFineTuningJobInsert,
) {
  const { data, error } = await supabase
    .from("whisper_fine_tuning_jobs")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getFineTuningJobsByDataset(
  supabase: AppSupabaseClient,
  datasetId: string,
) {
  const { data, error } = await supabase
    .from("whisper_fine_tuning_jobs")
    .select("*")
    .eq("dataset_id", datasetId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getFineTuningJobById(
  supabase: AppSupabaseClient,
  jobId: string,
) {
  const { data, error } = await supabase
    .from("whisper_fine_tuning_jobs")
    .select("*, dataset:whisper_datasets!inner(*)")
    .eq("id", jobId)
    .single();
  return { data, error };
}

export async function updateFineTuningJob(
  supabase: AppSupabaseClient,
  jobId: string,
  values: WhisperFineTuningJobUpdate,
) {
  const { data, error } = await supabase
    .from("whisper_fine_tuning_jobs")
    .update(values)
    .eq("id", jobId)
    .select()
    .single();
  return { data, error };
}

export async function deleteFineTuningJob(
  supabase: AppSupabaseClient,
  jobId: string,
) {
  const { error } = await supabase
    .from("whisper_fine_tuning_jobs")
    .delete()
    .eq("id", jobId);
  return { error };
}

// ---- Church Requests ----

export async function createChurchRequest(
  supabase: AppSupabaseClient,
  values: ChurchRequestInsert,
) {
  const { data, error } = await supabase
    .from("church_requests")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getChurchRequestByToken(
  supabase: AppSupabaseClient,
  token: string,
) {
  const { data, error } = await supabase
    .from("church_requests")
    .select("*")
    .eq("confirmation_token", token)
    .single();
  return { data, error };
}

export async function getChurchRequestById(
  supabase: AppSupabaseClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("church_requests")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function getAllChurchRequests(
  supabase: AppSupabaseClient,
) {
  const { data, error } = await supabase
    .from("church_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function updateChurchRequest(
  supabase: AppSupabaseClient,
  id: string,
  values: ChurchRequestUpdate,
) {
  const { data, error } = await supabase
    .from("church_requests")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

// ---- Organization Invitations ----

export async function createInvitation(
  supabase: AppSupabaseClient,
  values: OrganizationInvitationInsert,
) {
  const { data, error } = await (supabase as any)
    .from("organization_invitations")
    .insert(values)
    .select()
    .single();
  return { data, error };
}

export async function getInvitationsByOrganization(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { data, error } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getInvitationByToken(
  supabase: AppSupabaseClient,
  token: string,
) {
  const { data, error } = await (supabase as any).rpc("get_invitation_by_token", {
    p_token: token,
  });
  return { data: data as Record<string, unknown> | null, error };
}

export async function acceptInvitationRpc(
  supabase: AppSupabaseClient,
  token: string,
) {
  const { data, error } = await (supabase as any).rpc("accept_invitation", {
    p_token: token,
  });
  return { data: data as Record<string, unknown> | null, error };
}

export async function updateInvitation(
  supabase: AppSupabaseClient,
  id: string,
  values: OrganizationInvitationUpdate,
) {
  const { data, error } = await (supabase as any)
    .from("organization_invitations")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}
