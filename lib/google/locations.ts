import { getValidAccessToken } from "@/lib/google/tokens";
import { googleFetch } from "@/lib/google/api";

export type GoogleLocation = {
  name: string; // "locations/123"
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
};

export function formatAddress(loc: GoogleLocation): string {
  const a = loc.storefrontAddress;
  if (!a) return "";
  return [
    ...(a.addressLines ?? []),
    a.locality,
    a.administrativeArea,
    a.postalCode,
    a.regionCode,
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * googleLocationsService — list the locations under a given account.
 * (My Business Business Information API.) readMask is required.
 */
export async function listLocations(
  userId: string,
  accountName: string,
): Promise<GoogleLocation[]> {
  const token = await getValidAccessToken(userId);
  const readMask = "name,title,storefrontAddress";
  const data = await googleFetch<{ locations?: GoogleLocation[] }>(
    token,
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=${readMask}&pageSize=100`,
  );
  return data.locations ?? [];
}
