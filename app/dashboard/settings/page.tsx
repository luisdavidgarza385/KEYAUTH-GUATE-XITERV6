import { store } from "@/lib/store";
import { requireAdmin, getScopedAppIds } from "@/lib/auth";
import { Settings as SettingsIcon, Key, Palette } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { VariablesManager } from "@/components/VariablesManager";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const scopedIds = await getScopedAppIds(admin);
  const allApps = await store.listApps();
  const apps = scopedIds === null ? allApps : allApps.filter((a) => scopedIds.includes(a.id));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Account & application configuration</p>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Account</h2>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="label">Email</div>
            <div className="font-mono text-text-muted">{admin.email}</div>
          </div>
          <div>
            <div className="label">Role</div>
            <span className="badge-accent">{admin.role}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <ThemeCustomizer />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Key className="w-4 h-4 text-accent-glow" /> Application credentials
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Use these in your client application. Keep <code className="text-accent-glow">app_secret</code> and <code className="text-accent-glow">owner_secret</code> private.
        </p>
        {apps.length > 0 ? (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="rounded border border-border bg-bg-secondary/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{a.name}</h3>
                  <span className="badge-accent text-[10px]">v{a.version}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <SecretRow label="App ID" value={a.app_id} />
                  <SecretRow label="App Secret" value={a.app_secret} />
                  <SecretRow label="Owner Secret" value={a.owner_secret} />
                  <div>
                    <div className="label">API base</div>
                    <div className="font-mono text-xs text-text-muted">/api/1.0</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No applications configured.</p>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Variables</h2>
        <p className="text-xs text-text-muted mb-4">
          Server-side variables your app can read with <code className="text-accent-glow">/api/1.0/var</code>.
        </p>
        <VariablesManager apps={apps} />
      </div>
    </div>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="flex items-center gap-2 bg-bg rounded px-2 py-1.5 border border-border">
        <code className="text-xs text-text-muted font-mono truncate flex-1">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}
