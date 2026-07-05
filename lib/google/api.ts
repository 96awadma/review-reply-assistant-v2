/**
 * Low-level authenticated Google API fetch + error interpretation.
 * Turns raw Google errors into friendly, actionable reasons (never raw JSON
 * to the browser).
 */

export type GoogleErrorReason =
  | "not_connected"
  | "no_refresh"
  | "not_approved"
  | "permission_denied"
  | "unauthorized"
  | "unknown";

export class GoogleApiError extends Error {
  reason: GoogleErrorReason;
  status?: number;
  constructor(reason: GoogleErrorReason, message: string, status?: number) {
    super(message);
    this.name = "GoogleApiError";
    this.reason = reason;
    this.status = status;
  }
}

/** Human-friendly text for each reason (shown in the UI). */
export function reasonMessage(reason: GoogleErrorReason): string {
  switch (reason) {
    case "not_connected":
      return "Google isn't connected. Connect your Google account first.";
    case "no_refresh":
      return "Your Google session can't be refreshed. Please disconnect and reconnect Google.";
    case "not_approved":
      return "Google OAuth is connected, but Business Profile API access is not available yet. Your access request is pending Google's approval (this can take several business days).";
    case "permission_denied":
      return "Access denied by Google. The connected account may not be an owner/manager of this business, or API access isn't approved yet.";
    case "unauthorized":
      return "Google rejected the token. Please disconnect and reconnect Google.";
    default:
      return "Something went wrong talking to Google. Please try again.";
  }
}

function classify(status: number, body: unknown): GoogleApiError {
  const asText = JSON.stringify(body ?? {});
  const message =
    (body as { error?: { message?: string } })?.error?.message ?? "";

  // Quota == 0 is Google's signature for "project not allowlisted / approved yet".
  const quotaZero =
    asText.includes('"quota_limit_value":"0"') ||
    /quota_limit_value.*0/.test(asText);

  if (status === 429 && (quotaZero || /quota|RESOURCE_EXHAUSTED/i.test(asText))) {
    return new GoogleApiError("not_approved", reasonMessage("not_approved"), status);
  }
  if (status === 401) {
    return new GoogleApiError("unauthorized", reasonMessage("unauthorized"), status);
  }
  if (status === 403) {
    // Could be "not enabled" / "not approved" / "no permission".
    if (/PERMISSION_DENIED|not been used|disabled/i.test(asText) && /quota|Business Profile|mybusiness/i.test(asText)) {
      return new GoogleApiError("not_approved", reasonMessage("not_approved"), status);
    }
    return new GoogleApiError("permission_denied", reasonMessage("permission_denied"), status);
  }
  return new GoogleApiError("unknown", message || `Google API error (${status}).`, status);
}

export async function googleFetch<T = unknown>(
  accessToken: string,
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (res.ok) {
    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  }

  let body: unknown = null;
  const text = await res.text().catch(() => "");
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  throw classify(res.status, body);
}
