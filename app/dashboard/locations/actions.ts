"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, createClient } from "@/lib/supabase/server";

export async function selectLocation(formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/dashboard/locations");

  const accountId = String(formData.get("accountId") ?? "").trim();
  const locationId = String(formData.get("locationId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!accountId || !locationId) return;

  const supabase = createClient();

  // Only one selected location at a time.
  await supabase
    .from("business_locations")
    .update({ is_selected: false })
    .eq("user_id", user.id);

  await supabase.from("business_locations").upsert(
    {
      user_id: user.id,
      google_account_id: accountId,
      location_id: locationId,
      display_name: displayName || null,
      address: address || null,
      is_selected: true,
    },
    { onConflict: "user_id,location_id" },
  );

  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard/reviews");
}
