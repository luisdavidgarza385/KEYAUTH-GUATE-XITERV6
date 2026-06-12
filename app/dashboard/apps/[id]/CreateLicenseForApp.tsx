"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check, Loader2 } from "lucide-react";

export function CreateLicenseForApp({ appId }: { appId: string }) {
  const [count, setCount] = useState(1);
  const [duration, setDuration] = useState(30);
  const [level, setLevel] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [hwidLock, setHwidLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function create() {
    setLoading(true);
    const res = await fetch("/api/admin/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId,
        count,
        durationDays: duration,
        level,
        maxUses,
        hwidLock,
      }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Error");
      return;
    }
    setKeys(data.data.keys);
    router.refresh();
  }

  if (keys) {
    return (
      <div>
        <p className="text-xs text-text-muted mb-2">{keys.length} license(s) generated</p>
        <div className="bg-bg rounded border border-border p-2 max-h-40 overflow-y-auto font-mono text-xs space-y-1 mb-3">
          {keys.map((k) => <div key={k}>{k}</div>)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(keys.join("\n"));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn-secondary text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            Copy all
          </button>
          <button onClick={() => setKeys(null)} className="btn-primary text-xs">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs">
        <span className="text-text-dim">Costo:</span>
        <span className="font-semibold text-blue-400">35 coins por licencia</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Count</label>
          <input type="number" min={1} max={500} className="input text-sm" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className="label">Duración</label>
          <select className="input text-sm" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
            <option value={1}>1 día</option>
            <option value={3}>3 días</option>
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
            <option value={180}>180 días</option>
            <option value={365}>365 días</option>
            <option value={36500}>De por vida</option>
          </select>
        </div>
        <div>
          <label className="label">Level</label>
          <input type="number" min={1} className="input text-sm" value={level} onChange={(e) => setLevel(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className="label">Max uses</label>
          <input type="number" min={1} className="input text-sm" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={hwidLock} onChange={(e) => setHwidLock(e.target.checked)} className="accent-accent" />
        HWID lock
      </label>
      <button onClick={create} disabled={loading} className="btn-primary text-sm w-full">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        Generate {count} license{count > 1 ? "s" : ""}
      </button>
    </div>
  );
}
