import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import {
  getUserChurches,
  getUserChurchesViaMembership,
  getChurchById,
  getOrganizationById,
  getOrganizationsByChurch,
  getMembersByOrganization,
  getRecordingsByOrganization,
  getRecordingsWithTranscription,
  getDatasetsByChurch,
  getDatasetById,
  getDatasetRecordings,
  getFineTuningJobsByDataset,
  getChurchAdmins,
  getInvitationsByOrganization,
  getPendingInvitationsByEmail,
} from "@/features/churches/lib/server/queries";

export async function loadUserChurchesPageData(
  supabase: AppSupabaseClient,
  userId: string,
) {
  const { data: adminChurches } = await getUserChurches(supabase, userId);
  const { data: memberChurches } = await getUserChurchesViaMembership(
    supabase,
    userId,
  );

  const map = new Map<string, any>();
  for (const c of adminChurches ?? []) {
    map.set(c.id, { ...c, member_role: "admin" });
  }
  for (const c of memberChurches ?? []) {
    if (!map.has(c.id)) {
      map.set(c.id, { ...c, member_role: "member" });
    }
  }

  const { data: pendingInvites } = await getPendingInvitationsByEmail(supabase);

  return {
    churches: Array.from(map.values()),
    pendingInvites: pendingInvites ?? [],
  };
}

export async function loadChurchDashboardPageData(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data: church } = await getChurchById(supabase, churchId);
  const { data: organizations } = await getOrganizationsByChurch(
    supabase,
    churchId,
  );
  const { data: admins } = await getChurchAdmins(supabase, churchId);
  const { data: recordings } = await getRecordingsWithTranscription(
    supabase,
    churchId,
  );

  return {
    church,
    organizations: organizations ?? [],
    admins: admins ?? [],
    transcribedRecordings: recordings ?? [],
  };
}

export async function loadOrganizationPageData(
  supabase: AppSupabaseClient,
  orgId: string,
) {
  const { data: org } = await getOrganizationById(supabase, orgId);
  const { data: members } = await getMembersByOrganization(supabase, orgId);
  const { data: recordings } = await getRecordingsByOrganization(
    supabase,
    orgId,
  );
  const { data: invitations } = await getInvitationsByOrganization(
    supabase,
    orgId,
  );

  return {
    organization: org,
    members: members ?? [],
    recordings: recordings ?? [],
    invitations: invitations ?? [],
  };
}

export async function loadDatasetsPageData(
  supabase: AppSupabaseClient,
  churchId: string,
) {
  const { data: datasets } = await getDatasetsByChurch(supabase, churchId);
  const { data: church } = await getChurchById(supabase, churchId);

  return {
    church,
    datasets: datasets ?? [],
  };
}

export async function loadDatasetDetailPageData(
  supabase: AppSupabaseClient,
  datasetId: string,
) {
  const { data: dataset } = await getDatasetById(supabase, datasetId);
  const { data: recordings } = await getDatasetRecordings(supabase, datasetId);
  const { data: jobs } = await getFineTuningJobsByDataset(
    supabase,
    datasetId,
  );

  return {
    dataset,
    recordings: recordings ?? [],
    jobs: jobs ?? [],
  };
}
