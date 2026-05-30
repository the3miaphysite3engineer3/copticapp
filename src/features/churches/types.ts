import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type ChurchRow = Tables<"churches">;
export type ChurchInsert = TablesInsert<"churches">;
export type ChurchUpdate = TablesUpdate<"churches">;

export type ChurchAdminRow = Tables<"church_admins">;
export type ChurchAdminInsert = TablesInsert<"church_admins">;

export type ChurchOrganizationRow = Tables<"church_organizations">;
export type ChurchOrganizationInsert = TablesInsert<"church_organizations">;
export type ChurchOrganizationUpdate = TablesUpdate<"church_organizations">;

export type OrganizationMemberRow = Tables<"organization_members">;
export type OrganizationMemberInsert = TablesInsert<"organization_members">;
export type OrganizationMemberUpdate = TablesUpdate<"organization_members">;

export type AudioRecordingRow = Tables<"audio_recordings">;
export type AudioRecordingInsert = TablesInsert<"audio_recordings">;
export type AudioRecordingUpdate = TablesUpdate<"audio_recordings">;

export type WhisperDatasetRow = Tables<"whisper_datasets">;
export type WhisperDatasetInsert = TablesInsert<"whisper_datasets">;
export type WhisperDatasetUpdate = TablesUpdate<"whisper_datasets">;

export type WhisperFineTuningJobRow = Tables<"whisper_fine_tuning_jobs">;
export type WhisperFineTuningJobInsert = TablesInsert<"whisper_fine_tuning_jobs">;
export type WhisperFineTuningJobUpdate = TablesUpdate<"whisper_fine_tuning_jobs">;

export type OrgType = "sunday_kids" | "deacons" | "other";
export type MemberRole = "member" | "leader" | "teacher" | "assistant";
export type RecordingStatus = "pending" | "transcribed" | "approved" | "rejected";
export type DatasetStatus = "draft" | "preparing" | "ready" | "exported" | "training" | "completed" | "failed";
export type JobStatus = "pending" | "preparing" | "training" | "completed" | "failed";

export type ChurchWithAdmin = ChurchRow & {
  church_admins?: ChurchAdminRow[];
  organizations?: ChurchOrganizationRow[];
};

export type OrganizationWithStats = ChurchOrganizationRow & {
  member_count?: number;
  recording_count?: number;
};

export type ChurchRequestRow = Tables<"church_requests">;
export type ChurchRequestInsert = TablesInsert<"church_requests">;
export type ChurchRequestUpdate = TablesUpdate<"church_requests">;
