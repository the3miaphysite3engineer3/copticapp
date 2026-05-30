import { notFound } from "next/navigation";
import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { getChurchById, getOrganizationsByChurch } from "@/features/churches/lib/server/queries";

export default async function OrganizationsPage({
  params,
}: {
  params: Promise<{ churchId: string }>;
}) {
  const { churchId } = await params;
  const { supabase, user } = await requireAuthenticatedPageSession(
    `/churches/${churchId}/organizations`,
  );

  const { data: church } = await getChurchById(supabase, churchId);
  if (!church) notFound();

  const { data: organizations } = await getOrganizationsByChurch(
    supabase,
    churchId,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <a
          href={`/churches/${churchId}`}
          className="text-ink/50 hover:text-ink mb-2 block text-sm"
        >
          &larr; {church.name}
        </a>
        <h1 className="text-3xl font-bold">Organizations</h1>
        <p className="text-ink/60 mt-1">
          Sunday Kids, Deacons, and other ministry groups
        </p>
      </div>

      <div className="border-line rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">Create Organization</h2>
        <OrganizationForm churchId={churchId} />
      </div>

      <div className="space-y-4">
        {!organizations || organizations.length === 0 ? (
          <div className="border-line rounded-lg border p-12 text-center">
            <p className="text-ink/50">No organizations yet.</p>
          </div>
        ) : (
          organizations.map((org) => (
            <div
              key={org.id}
              className="border-line hover:border-ink/30 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{org.name}</h3>
                  <span className="bg-surface text-ink/60 mt-1 inline-block rounded-full px-2 py-0.5 text-xs">
                    {org.type === "sunday_kids"
                      ? "Sunday Kids"
                      : org.type === "deacons"
                        ? "Deacons"
                        : "Other"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/churches/${churchId}/organizations/${org.id}`}
                    className="border-line hover:bg-surface/80 rounded-lg border px-3 py-1.5 text-sm"
                  >
                    Manage
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OrganizationForm({ churchId }: { churchId: string }) {
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
            placeholder="e.g. St. Mark Deacons"
          />
        </div>
        <div>
          <label htmlFor="slug" className="text-ink/70 mb-1 block text-sm">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            required
            className="border-line focus:border-accent w-full rounded-lg border px-3 py-2 text-sm outline-none"
            placeholder="st-mark-deacons"
          />
        </div>
        <div>
          <label htmlFor="type" className="text-ink/70 mb-1 block text-sm">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="border-line focus:border-accent w-full rounded-lg border px-3 py-2 text-sm outline-none"
          >
            <option value="sunday_kids">Sunday Kids</option>
            <option value="deacons">Deacons</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <button
        formAction={async (formData: FormData) => {
          "use server";
          const { createOrganizationAction } = await import(
            "@/actions/churches"
          );
          await createOrganizationAction(null, formData);
        }}
        className="bg-accent hover:bg-accent/90 rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        Create Organization
      </button>
    </form>
  );
}
