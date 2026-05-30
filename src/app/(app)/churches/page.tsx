import { requireAuthenticatedPageSession } from "@/lib/supabase/auth";
import { loadUserChurchesPageData } from "@/features/churches/lib/server/pageData";
import { CreateChurchForm } from "@/features/churches/components/CreateChurchForm";

export default async function ChurchesPage() {
  const { supabase, user } = await requireAuthenticatedPageSession("/churches");
  const { churches } = await loadUserChurchesPageData(supabase, user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Churches</h1>
          <p className="text-ink/60 mt-1">Manage your church communities</p>
        </div>
        <CreateChurchForm />
      </div>

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
          {churches.map((church) => (
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
