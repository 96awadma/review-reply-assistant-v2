import { getValidAccessToken } from "@/lib/google/tokens";
import { googleFetch } from "@/lib/google/api";

export type GoogleAccount = {
  name: string; // "accounts/123456789"
  accountName?: string;
  type?: string;
  role?: string;
  verificationState?: string;
};

/**
 * googleAccountsService — list the Business Profile accounts the connected
 * Google user can manage. (My Business Account Management API.)
 */
export async function listAccounts(userId: string): Promise<GoogleAccount[]> {
  const token = await getValidAccessToken(userId);
  const data = await googleFetch<{ accounts?: GoogleAccount[] }>(
    token,
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
  );
  return data.accounts ?? [];
}
