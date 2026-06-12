"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Trash2, Plus } from "lucide-react";
import { CreateMenu, BulkDeleteLicensesModal } from "./CreateMenu";

export function LicensesPageActions({ apps, filteredAppId, role, subscriptionEnd }: { apps: { id: string; name: string }[]; filteredAppId?: string; role: string; subscriptionEnd: string | null }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const router = useRouter();

  const isDeveloper = role === "developer";
  const hasSub = subscriptionEnd ? new Date(subscriptionEnd).getTime() > Date.now() : false;
  const forcePrefix = !isDeveloper && !hasSub;

  return (
    <>
      <button
        onClick={() => setCreateOpen(true)}
        className="w-9 h-9 rounded-md flex items-center justify-center border border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text transition"
        title="Create license"
      >
        <Key className="w-4 h-4" />
      </button>
      <button
        onClick={() => setBulkOpen(true)}
        className="w-9 h-9 rounded-md flex items-center justify-center border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20 transition"
        title="Delete licenses"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {createOpen && (
        <CreateLicenseInline apps={apps} defaultAppId={filteredAppId} onClose={() => setCreateOpen(false)} forcePrefix={forcePrefix} />
      )}
      {bulkOpen && (
        <BulkDeleteLicensesModal apps={apps} onClose={() => setBulkOpen(false)} />
      )}
    </>
  );
}

function CreateLicenseInline({ apps, defaultAppId, onClose, forcePrefix }: { apps: { id: string; name: string }[]; defaultAppId?: string; onClose: () => void; forcePrefix?: boolean }) {
  const [appId, setAppId] = useState(defaultAppId || apps[0]?.id || "");
  const [count, setCount] = useState(1);
  const [prefix, setPrefix] = useState(forcePrefix ? "KEYAUTHPRO" : "Guate Xiter");
  const [mask, setMask] = useState("******_******_******_******_******_******");
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState("1");
  const [unit, setUnit] = useState<"days" | "months" | "years">("days");
  const [duration, setDuration] = useState(30);
  const [hwidLock, setHwidLock] = useState(false);
  const [ipLock, setIpLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function submit() {
    setErr(null);
    if (!appId) { setErr("Application required"); return; }
    if (count < 1 || count > 500) { setErr("Count must be 1-500"); return; }
    if (duration < 1) { setErr("Duration must be at least 1"); return; }
    setLoading(true);
    const res = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, count, durationDays: duration, level, maxUses: 1, hwidLock, ipLock, prefix }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) { setErr(data.message || "Error"); return; }
    setGenerated(data.data.keys);
    router.refresh();
  }

  function copyAll() {
    if (!generated) return;
    navigator.clipboard.writeText(generated.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="relative bg-bg-card border border-border rounded-lg shadow-2xl w-full max-w-md my-auto"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Create a new license</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text p-1 -mr-1">×</button>
        </div>
        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          {generated ? (
            <>
              <p className="text-xs text-text-muted mb-3">Copy and save them now — they won&apos;t be shown again.</p>
              <div className="bg-bg-secondary border border-border rounded p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1 mb-4">
                {generated.map((k) => <div key={k}>{k}</div>)}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={copyAll} className="btn-secondary text-sm">
                  {copied ? "✓" : "Copy all"}
                </button>
                <button onClick={onClose} className="btn-primary text-sm">Done</button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Application *</label>
                <select className="input" value={appId} onChange={(e) => setAppId(e.target.value)}>
                  {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Importe de la licencia *</label>
                <input type="number" min={1} max={500} className="input" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} />
              </div>
              {forcePrefix && (
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Máscara de licencia</label>
                  <input className="input font-mono bg-bg-secondary/50" value="KEYAUTHPRO-****-****-****-****" disabled />
                  <p className="text-[10px] text-text-dim mt-1">Compra una suscripción para cambiar la máscara.</p>
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Máscara de licencia *</label>
                <input className="input font-mono" value={mask} onChange={(e) => setMask(e.target.value)} />
                <div className="flex items-center gap-4 mt-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-text-muted">
                    <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} className="accent-accent" /> Lowercase
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-text-muted">
                    <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-accent" /> Uppercase
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Nivel de suscripción *</label>
                <select className="input" value={level} onChange={(e) => setLevel(parseInt(e.target.value) || 1)}>
                  <option value={1}>1 (default)</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Nota de licencia</label>
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Unidad de vencimiento *</label>
                  <select className="input" value={unit} onChange={(e) => setUnit(e.target.value as any)}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-text-muted mb-1.5 block">Duración de la caducidad *</label>
                  <input type="number" min={1} className="input" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-text-muted">
                  <input type="checkbox" checked={hwidLock} onChange={(e) => setHwidLock(e.target.checked)} className="accent-accent" /> HWID lock
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-text-muted">
                  <input type="checkbox" checked={ipLock} onChange={(e) => setIpLock(e.target.checked)} className="accent-accent" /> IP lock
                </label>
              </div>
              {err && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded px-3 py-2">{err}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
                <button onClick={submit} className="btn-primary text-sm" disabled={loading}>
                  {loading ? "..." : "Create license"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
