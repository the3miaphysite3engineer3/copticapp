import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadUserChurchesPageData } from "@/features/churches/lib/server/pageData";
import { CreateChurchForm } from "@/features/churches/components/CreateChurchForm";
import { getAllChurchRequests } from "@/features/churches/lib/server/queries";
import { ApproveChurchRequestForm } from "@/features/churches/components/ApproveChurchRequestForm";

export default async function ChurchesPage() {
  const { supabase, user } = await requireAuthenticatedPageSession("/churches");
  const { churches, pendingInvites } = await loadUserChurchesPageData(
    supabase,
    user.id,
  );

  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile.data?.role === "admin";

  const { data: requests } = isAdmin
    ? await getAllChurchRequests(supabase)
    : { data: [] };

  const pendingRequests = requests?.filter((r) => r.status === "pending" || r.status === "confirmed") ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Churches</h1>
          <p className="text-ink/60 mt-1">Manage your church communities</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/churches/request"
            className="border-line hover:bg-surface/80 rounded-lg border px-4 py-2 text-sm"
          >
            Request Church
          </a>
          <CreateChurchForm />
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Pending Invitations ({pendingInvites.length})
          </h2>
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {pendingInvites.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {inv.organization_name ?? "Unknown Organization"}
                  </div>
                  <div className="text-ink/50 mt-0.5 text-sm">
                    {inv.church_name ? `${inv.church_name} · member` : "Invited to join as a member"}
                  </div>
                </div>
                <a
                  href={`/churches/invite?token=${inv.token}`}
                  className="bg-accent hover:bg-accent/90 shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white"
                >
                  Accept Invite
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAdmin && pendingRequests.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="border-line divide-line divide-y overflow-hidden rounded-lg border">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{req.name}</div>
                  <div className="text-ink/50 mt-0.5 text-sm">
                    {req.requester_name} &middot; {req.requester_email}
                  </div>
                  <div className="text-ink/40 mt-0.5 text-xs">
                    {req.city && `${req.city}${req.country ? ", " : ""}`}
                    {req.country}
                    {req.facebook_page_url && (
                      <>
                        {" "}&middot;{" "}
                        <a
                          href={req.facebook_page_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          Facebook
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    req.status === "confirmed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-surface text-ink/60"
                  }`}>
                    {req.status}
                  </span>
                  <ApproveChurchRequestForm requestId={req.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {churches.length === 0 ? (
        <div className="border-line rounded-lg border p-12 text-center">
          <p className="text-ink/50 text-lg">No churches yet</p>
          <p className="text-ink/40 mt-1 text-sm">
            Create a church to get started with organizations, members, and
            Coptic audio recording.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {churches.map((church: any) => (
            <a
              key={church.id}
              href={`/churches/${church.id}`}
              className="border-line hover:border-ink/30 rounded-lg border p-5 transition-colors"
            >
              <h2 className="text-xl font-semibold">{church.name}</h2>
              {church.description && (
                <p className="text-ink/60 mt-1 line-clamp-2 text-sm">
                  {church.description}
                </p>
              )}
              <div className="text-ink/40 mt-3 text-xs">
                {church.member_role === "member" && (
                  <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                    member
                  </span>
                )}
                {church.city && `${church.city}${church.country ? ", " : ""}`}
                {church.country}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
