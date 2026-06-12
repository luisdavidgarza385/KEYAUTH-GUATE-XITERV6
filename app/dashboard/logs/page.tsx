import { store } from "@/lib/store";
import { requireAdmin, getScopedAppIds } from "@/lib/auth";
import { FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { app?: string; level?: string };
}) {
  const me = await requireAdmin();
  const scopedIds = await getScopedAppIds(me);
  const allApps = await store.listApps();
  const apps = scopedIds === null ? allApps : allApps.filter((a) => scopedIds.includes(a.id));
  const logs = await store.listLogs({
    appId: searchParams.app || undefined,
    level: searchParams.level || undefined,
    limit: 300,
  });

  const appsById = new Map(apps.map((a) => [a.id, a]));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Logs</h1>
        <p className="text-sm text-text-muted mt-1">Events received from your applications</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm">
        {["all", "info", "warn", "error", "debug"].map((l) => (
          <FilterLink
            key={l}
            href={l === "all" ? "/dashboard/logs" : `/dashboard/logs?level=${l}`}
            label={l}
            active={(l === "all" && !searchParams.level) || searchParams.level === l}
          />
        ))}
        {apps.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-text-dim text-xs">App:</span>
            <FilterLink href="/dashboard/logs" label="All" active={!searchParams.app} />
            {apps.map((a) => (
              <FilterLink
                key={a.id}
                href={`/dashboard/logs?app=${a.id}`}
                label={a.name}
                active={searchParams.app === a.id}
              />
            ))}
          </div>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-10 h-10 text-text-dim mx-auto mb-3" />
            <p className="text-text-muted">No logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {logs.map((l) => (
              <div key={l.id} className="px-4 py-3 hover:bg-bg-hover/40 flex items-start gap-3 text-sm">
                <span
                  className={
                    l.level === "error"
                      ? "badge-danger"
                      : l.level === "warn"
                      ? "badge-warning"
                      : l.level === "debug"
                      ? "badge-accent"
                      : "badge-success"
                  }
                >
                  {l.level}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-xs text-text-muted truncate">{l.message}</div>
                  <div className="text-[10px] text-text-dim mt-0.5">
                    {l.app_id ? appsById.get(l.app_id)?.name || "—" : "—"} · {formatDate(l.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        "rounded px-3 py-1 border capitalize " +
        (active
          ? "bg-accent/10 border-accent/30 text-accent-glow"
          : "border-border text-text-muted hover:text-text hover:border-border-light")
      }
    >
      {label}
    </a>
  );
}
