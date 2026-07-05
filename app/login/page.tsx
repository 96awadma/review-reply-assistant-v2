import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  please_login_first: "Please sign in first to continue.",
  auth_failed:
    "That magic link couldn't be verified. It may have expired — request a new one below.",
  missing_code: "The sign-in link was incomplete. Please request a new one.",
  not_configured:
    "Sign-in isn't configured yet. Please try again shortly.",
};

function sanitizeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  const configured = isSupabaseConfigured();

  // Already signed in? Skip the form.
  if (configured) {
    const user = await getSessionUser();
    if (user) redirect(sanitizeRedirect(searchParams.redirect));
  }

  const redirectTo = sanitizeRedirect(searchParams.redirect);
  const errorMessage = searchParams.error
    ? ERROR_MESSAGES[searchParams.error] ?? "Something went wrong. Please try again."
    : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="text-sm text-slate-600">
          Access your Review Reply Assistant workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {errorMessage && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {errorMessage}
          </p>
        )}

        {configured ? (
          <LoginForm redirectTo={redirectTo} />
        ) : (
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">
              Sign-in isn&apos;t configured yet
            </p>
            <p className="mt-1">
              Supabase environment variables are missing. Once{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set, this page will
              show the magic-link form. Check{" "}
              <a href="/health" className="text-brand-600 underline">
                /health
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
