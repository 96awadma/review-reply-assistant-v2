import { redirect } from "next/navigation";
import { getSessionUser, createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { getConnection } from "@/lib/google/tokens";
import { listAccounts } from "@/lib/google/accounts";
import { listLocations, formatAddress } from "@/lib/google/locations";
import { GoogleApiError, reasonMessage } from "@/lib/google/api";
import { selectLocation } from "./actions";

export const dynamic = "force-dynamic";

type LocationItem = {
  accountId: string;
  locationId: string;
  title: string;
  address: string;
};

export default async function LocationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard/locations");

  const conn = await getConnection(user.id);
  const connected = Boolean(conn);

  const supabase = createClient();
  const { data: selectedRow } = await supabase
    .from("business_locations")
    .select("location_id")
    .eq("user_id", user.id)
    .eq("is_selected", true)
    .maybeSingle();
  const selectedId = selectedRow?.location_id ?? null;

  let items: LocationItem[] = [];
  let errorReason: string | null = null;
  let errorMessage: string | null = null;

  if (connected) {
    try {
      const accounts = await listAccounts(user.id);
      for (const acc of accounts) {
        const accountId = acc.name.split("/").pop() ?? "";
        const locs = await listLocations(user.id, acc.name);
        for (const loc of locs) {
          items.push({
            accountId,
            locationId: loc.name.split("/").pop() ?? "",
            title: loc.title ?? "(untitled location)",
            address: formatAddress(loc),
          });
        }
      }
    } catch (e) {
      if (e instanceof GoogleApiError) {
        errorReason = e.reason;
        errorMessage = reasonMessage(e.reason);
      } else {
        errorMessage = "Unexpected error loading locations.";
      }
    }
  }

  return (
    <DashboardShell email={user.email ?? ""} active="/dashboard/locations">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Locations
        </h1>
        <p className="text-sm text-slate-600">
          Choose which Google Business Profile location this app manages.
        </p>
      </div>

      {!connected && (
        <p className="text-sm text-slate-600">
          Google isn&apos;t connected.{" "}
          <a href="/dashboard/connect" className="text-brand-600 underline">
            Connect Google →
          </a>
        </p>
      )}

      {connected && errorReason === "not_approved" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <p className="font-semibold text-amber-900">
            Waiting on Google approval
          </p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      {connected && errorReason && errorReason !== "not_approved" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          {errorMessage}
        </div>
      )}

      {connected && !errorReason && items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-800">No locations found.</p>
          <p className="mt-1">Common reasons:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>The connected Google account isn&apos;t an owner/manager of the business.</li>
            <li>The Business Profile isn&apos;t verified.</li>
            <li>Business Profile API access isn&apos;t approved yet.</li>
            <li>The wrong OAuth scope was granted (reconnect Google).</li>
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isSelected = item.locationId === selectedId;
            return (
              <div
                key={item.locationId}
                className={
                  isSelected
                    ? "flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-brand-500 bg-brand-50 p-4"
                    : "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                }
              >
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.address}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">
                    location id: {item.locationId}
                  </p>
                </div>
                {isSelected ? (
                  <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                    Selected
                  </span>
                ) : (
                  <form action={selectLocation}>
                    <input type="hidden" name="accountId" value={item.accountId} />
                    <input type="hidden" name="locationId" value={item.locationId} />
                    <input type="hidden" name="displayName" value={item.title} />
                    <input type="hidden" name="address" value={item.address} />
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
                    >
                      Select
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
