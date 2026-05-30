import type { AppSupabaseClient } from "@/lib/supabase/queryTypes";
import {
  getUserChurches,
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
} from "@/features/churches/lib/server/queries";

export async function loadUserChurchesPageData(
  supabase: AppSupabaseClient,
  userId: string,
) {
  const { data: churches } = await getUserChurches(supabase, userId);
  return { churches: churches ?? [] };
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

  return {
    organization: org,
    members: members ?? [],
    recordings: recordings ?? [],
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
