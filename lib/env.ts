/**
 * Central env access. We never expose secret VALUES to the browser — only
 * booleans indicating whether each variable is configured.
 */

function isSet(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export type EnvStatus = {
  label: string;
  configured: boolean;
};

/**
 * Server-only: returns a yes/no configuration report. Safe to render because
 * it contains no secret values.
 */
export function getEnvStatus(): EnvStatus[] {
  return [
    {
      label: "Supabase URL",
      configured: isSet(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: "Supabase anon key",
      configured: isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    {
      label: "Google Client ID",
      configured: isSet(process.env.GOOGLE_CLIENT_ID),
    },
    {
      label: "Google Client Secret",
      configured: isSet(process.env.GOOGLE_CLIENT_SECRET),
    },
    {
      label: "Google Redirect URI",
      configured: isSet(process.env.GOOGLE_REDIRECT_URI),
    },
  ];
}

export function getNodeEnv(): string {
  return process.env.NODE_ENV ?? "unknown";
}

export type DeploymentInfo = {
  hosting: "Vercel" | "Local";
  vercelEnv: string; // production | preview | development | —
  appUrl: string; // configured public base URL, or "not set"
};

/**
 * Server-only, non-secret. Lets us confirm on the LIVE deployment that the app
 * is actually running on Vercel and reading the expected base URL.
 * Vercel automatically injects VERCEL / VERCEL_ENV / VERCEL_URL at runtime.
 */
export function getDeploymentInfo(): DeploymentInfo {
  const onVercel = process.env.VERCEL === "1";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "not set";

  return {
    hosting: onVercel ? "Vercel" : "Local",
    vercelEnv: process.env.VERCEL_ENV?.trim() || "—",
    appUrl,
  };
}
