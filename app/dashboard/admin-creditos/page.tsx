"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coins, Crown, Search, Loader2, Send, Calendar, Infinity, CreditCard, Check, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const PayPalCheckout = dynamic(() => import("@/components/PayPalCheckout").then((m) => ({ default: m.PayPalCheckout })), { ssr: false });

const PACKAGES = [
  { id: "monthly", label: "Mensual", price: 4, subDays: 30, popular: false },
  { id: "yearly", label: "Anual", price: 15, subDays: 365, popular: true },
];

export default function AdminCreditosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [credits, setCredits] = useState(1000);
  const [days, setDays] = useState(30);
  const [action, setAction] = useState<"credits" | "subscription" | "unlimited">("credits");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [myEmail, setMyEmail] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) { setMyEmail(d.data?.email || ""); } });
    fetch("/api/admin/managers").then((r) => r.json()).catch(() => {});
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/subscriptions");
      const d = await res.json();
      if (d.success) setUsers(d.data);
    } catch {}
  }

  const filtered = users.filter((u: any) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const selectedUser = users.find((u: any) => u.id === selected);

  async function handleSubmit() {
    setMsg(null);
    if (!selected) { setMsg({ type: "err", text: "Select a user" }); return; }
    setLoading(true);
    try {
      if (action === "unlimited") {
        const res = await fetch("/api/admin/send-credits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: selectedUser?.email, action: "unlimited" }),
        });
        const d = await res.json();
        setMsg({ type: res.ok ? "ok" : "err", text: d.message || "Done" });
      } else if (action === "credits") {
        const res = await fetch("/api/admin/send-credits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: selectedUser?.email, credits, action: "add" }),
        });
        const d = await res.json();
        setMsg({ type: res.ok ? "ok" : "err", text: d.message || "Done" });
      } else if (action === "subscription") {
        const res = await fetch("/api/admin/set-subscription", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: selectedUser?.email, days }),
        });
        const d = await res.json();
        setMsg({ type: res.ok ? "ok" : "err", text: d.message || "Done" });
      }
      loadUsers(); router.refresh();
    } catch (e: any) { setMsg({ type: "err", text: e.message }); }
    setLoading(false);
  }

  function getRemainingDays(endDate: string | null): number {
    if (!endDate) return 0;
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 text-zinc-300">
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
          <Crown className="w-5 h-5 text-amber-400" />
          Admin Créditos
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Gestiona créditos, suscripciones y usuarios.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Usuarios</div>
          <div className="text-2xl font-black mt-1 font-mono text-amber-400">{users.length}</div>
        </div>
        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-blue-500 bg-blue-500/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">PayPal</div>
          <div className="text-2xl font-black mt-1 font-mono text-blue-400 text-sm">{PACKAGES.length} paquetes</div>
        </div>
        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Setup admcreditos</div>
          <button onClick={async () => {
            const res = await fetch("/api/admin/setup-admcreditos");
            const d = await res.json();
            setMsg({ type: res.ok ? "ok" : "err", text: d.message });
          }} className="text-xs font-semibold text-emerald-400 underline mt-1">Crear cuenta maestra</button>
        </div>
      </div>

      {/* Packages */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Comprar Créditos + Suscripción
        </h3>
        <p className="text-xs text-zinc-500">Selecciona un plan y paga con PayPal. Obtendrás acceso <strong className="text-amber-400">ilimitado</strong>: sin costos por crear usuarios/licencias, sin límites de cuota y máscara personalizable.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-lg border p-4 space-y-3 transition cursor-pointer ${
                selectedPkg === pkg.id
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
              }`}
              onClick={() => setSelectedPkg(pkg.id)}
            >
              {pkg.popular && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Popular</span>
              )}
              <div className="text-lg font-black text-zinc-100">${pkg.price}</div>
              <div className="text-sm font-bold text-zinc-200">{pkg.label}</div>
              <div className="space-y-1 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Usuarios y licencias ilimitados</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Sin costo por creación</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Máscara personalizable</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> {pkg.subDays} días de suscripción</div>
              </div>
              {selectedPkg === pkg.id && (
                <div className="pt-2">
                  <PayPalCheckout
                    pkgId={pkg.id}
                    amount={String(pkg.price)}
                    description={`Suscripción ${pkg.label} - ${pkg.subDays}d acceso ilimitado`}
                    onSuccess={(data) => {
                      setMsg({ type: "ok", text: data.message || "Compra exitosa!" });
                      setSelectedPkg(null);
                      router.refresh();
                    }}
                    onError={(err) => setMsg({ type: "err", text: err })}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Search */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-400" />
          Gestionar Usuarios
        </h3>
        <input className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-amber-500/50 transition" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por email..." />
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered.map((u: any) => (
            <button key={u.id} onClick={() => setSelected(u.id)} className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition ${selected === u.id ? "bg-amber-500/20 border border-amber-500/30 text-amber-300" : "bg-zinc-900/40 border border-zinc-800/40 text-zinc-400 hover:bg-zinc-800"}`}>
              <span>{u.email}</span>
              <span className="ml-2 text-[10px] opacity-60">({u.role})</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-xs text-zinc-500 py-2 text-center">No users found</p>}
        </div>
      </div>

      {/* Selected User Info */}
      {selectedUser && (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-100">{selectedUser.email}<span className="ml-2 text-[10px] text-zinc-500 font-mono">{selectedUser.role}</span></h3>
            <span className="text-xs text-zinc-500">{getRemainingDays(selectedUser.subscription_end)}d restantes</span>
          </div>
          <div className="flex gap-2">
            {(["credits", "subscription", "unlimited"] as const).map((a) => (
              <button key={a} onClick={() => setAction(a)} className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                action === a
                  ? a === "credits" ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                    : a === "subscription" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400"
              }`}>
                {a === "credits" ? <><Coins className="w-3 h-3 inline mr-1" />Enviar Créditos</>
                  : a === "subscription" ? <><Calendar className="w-3 h-3 inline mr-1" />Suscripción</>
                  : <><Infinity className="w-3 h-3 inline mr-1" />Ilimitado</>}
              </button>
            ))}
          </div>
          {action === "credits" && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Cantidad de créditos</label>
              <input type="number" min={1} className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-amber-500/50 transition font-mono" value={credits} onChange={(e) => setCredits(parseInt(e.target.value) || 0)} />
            </div>
          )}
          {action === "subscription" && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Días de suscripción</label>
              <div className="flex gap-2 flex-wrap">
                {[7, 15, 30, 60, 90, 180, 365].map((d) => (
                  <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded text-xs font-mono transition ${days === d ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border border-zinc-800 text-zinc-400"}`}>{d}d</button>
                ))}
                <input type="number" min={1} className="w-20 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-1.5 rounded text-xs outline-none focus:border-emerald-500/50 transition font-mono" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 30)} />
              </div>
            </div>
          )}
          {action === "unlimited" && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-zinc-400">
              Esto pondrá al usuario como <strong className="text-amber-400">ilimitado</strong> con 999,999,999 créditos y suscripción permanente.
            </div>
          )}
          {msg && (
            <div className={`text-xs px-3 py-2 rounded ${msg.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{msg.text}</div>
          )}
          <button onClick={handleSubmit} disabled={loading} className="w-full py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition disabled:opacity-60 flex items-center justify-center gap-1.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {action === "credits" ? `Enviar ${credits} créditos` : action === "subscription" ? `Asignar ${days} días` : "Activar Ilimitado"}
          </button>
        </div>
      )}

      {/* PayPal paypal.me link */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-4 flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          <span className="font-bold text-zinc-300">¿Sin tarjeta?</span> También puedes donar vía PayPal.me y recibir créditos manualmente.
        </div>
        <a href="https://www.paypal.com/paypalme/david639935/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition">
          <CreditCard className="w-3.5 h-3.5" /> PayPal.me
        </a>
      </div>
    </div>
  );
}
