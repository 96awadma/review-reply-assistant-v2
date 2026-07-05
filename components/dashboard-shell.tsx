import Link from "next/link";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/connect", label: "Connect" },
  { href: "/dashboard/locations", label: "Locations" },
  { href: "/dashboard/reviews", label: "Reviews" },
  { href: "/dashboard/diagnostics", label: "Diagnostics" },
  { href: "/settings", label: "Settings" },
];

export function DashboardShell({
  email,
  active,
  children,
}: {
  email: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 sm:px-3">
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const isActive = item.href === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  (isActive
                    ? "bg-brand-50 text-brand-600"
                    : "text-slate-600 hover:bg-slate-50") +
                  " shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden shrink-0 text-xs text-slate-400 lg:block">
          {email}
        </span>
        <form action="/auth/signout" method="post" className="shrink-0">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>

      {children}
    </div>
  );
}
