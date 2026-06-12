"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";

export function CreateUserForApp({ appId }: { appId: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [durationDisplay, setDurationDisplay] = useState("30|days");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  function gen() {
    setUsername(`user_${Math.random().toString(36).slice(2, 8)}`);
    setPassword(Math.random().toString(36).slice(2, 14) + "A1!");
  }

  async function create() {
    if (!username || !password) return;
    setLoading(true);
    const [durVal, durUnit] = durationDisplay.split("|");
    let durationDays = parseInt(durVal);
    if (durUnit === "months") durationDays *= 30;
    else if (durUnit === "years") durationDays *= 365;
    const res = await fetch("/api/admin/app-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appId, username, password, email, durationDays }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Error");
      return;
    }
    setCreated({ username, password });
    setUsername("");
    setPassword("");
    setEmail("");
    router.refresh();
  }

  if (created) {
    return (
      <div>
        <p className="text-xs text-text-muted mb-2">User created</p>
        <div className="bg-bg rounded border border-border p-3 text-sm space-y-1.5 mb-3">
          <div className="flex justify-between"><span className="text-text-muted text-xs">username</span><code className="font-mono text-xs">{created.username}</code></div>
          <div className="flex justify-between"><span className="text-text-muted text-xs">password</span><code className="font-mono text-xs">{created.password}</code></div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`user: ${created.username}\npass: ${created.password}`);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn-secondary text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
          <button onClick={() => setCreated(null)} className="btn-primary text-xs">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Username</label>
        <input className="input text-sm" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="john_doe" />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="flex gap-2">
          <input className="input text-sm flex-1" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <button onClick={gen} type="button" className="btn-secondary text-xs shrink-0">Generate</button>
        </div>
      </div>
      <div>
        <label className="label">Email (optional)</label>
        <input className="input text-sm" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
      </div>
      <div>
        <label className="label">Duración de suscripción</label>
        <select className="input text-sm" value={durationDisplay} onChange={(e) => setDurationDisplay(e.target.value)}>
          <option value="1|days">1 día</option>
          <option value="3|days">3 días</option>
          <option value="7|days">7 días</option>
          <option value="15|days">15 días</option>
          <option value="30|days">30 días</option>
          <option value="90|days">90 días</option>
          <option value="180|days">180 días</option>
          <option value="365|days">365 días</option>
          <option value="1|months">1 mes</option>
          <option value="3|months">3 meses</option>
          <option value="6|months">6 meses</option>
          <option value="12|months">12 meses</option>
          <option value="1|years">1 año</option>
          <option value="0|lifetime">De por vida</option>
        </select>
      </div>
      <button onClick={create} disabled={loading || !username || !password} className="btn-primary text-sm w-full">
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
        Create user
      </button>
    </div>
  );
}
