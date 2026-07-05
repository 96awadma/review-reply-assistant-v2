import { getEnvStatus, getNodeEnv, getDeploymentInfo } from "@/lib/env";

// Always render dynamically so the report reflects the live environment.
export const dynamic = "force-dynamic";

function StatusRow({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-none">
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={
          configured
            ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            : "inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
        }
      >
        <span
          className={
            configured
              ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
              : "h-1.5 w-1.5 rounded-full bg-rose-500"
          }
        />
        {configured ? "yes" : "no"}
      </span>
    </div>
  );
}

export default function HealthPage() {
  const env = getEnvStatus();
  const nodeEnv = getNodeEnv();
  const deploy = getDeploymentInfo();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Health check
        </h1>
        <p className="text-sm text-slate-600">
          Confirms the app is running and which environment variables are
          configured. Secret values are never shown — only yes/no.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <span className="text-sm font-medium text-slate-700">App running</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            yes
          </span>
        </div>

        {env.map((item) => (
          <StatusRow
            key={item.label}
            label={item.label}
            configured={item.configured}
          />
        ))}

        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <span className="text-sm text-slate-700">Node environment</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {nodeEnv}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 py-3">
          <span className="text-sm text-slate-700">Hosting</span>
          <span
            className={
              deploy.hosting === "Vercel"
                ? "rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600"
                : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            }
          >
            {deploy.hosting}
            {deploy.vercelEnv !== "—" ? ` · ${deploy.vercelEnv}` : ""}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3">
          <span className="text-sm text-slate-700">App base URL</span>
          <span className="max-w-[60%] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {deploy.appUrl}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        If any item shows <span className="font-medium">no</span>, add the
        variable to <code>.env.local</code> (local) or your Vercel project
        settings (production), then reload this page.
      </p>
    </div>
  );
}
