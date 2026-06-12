"use client";
import { useState, useEffect } from "react";
import { Coins, Plus, Loader2, Wallet, TrendingUp, ShoppingCart, History, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CreditsPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [role, setRole] = useState<string>("");
  const [hasSub, setHasSub] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, []);

  async function fetchCredits() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (res.ok && data.success) {
        setCredits(data.data?.credits ?? 0);
        setRole(data.data?.role || "");
        setHasSub(data.data?.hasSubscription ?? false);
      }
    } catch {} finally { setLoading(false); }
  }

  const isUnlimited = role === "developer" || hasSub;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Cargando créditos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto text-zinc-300">
      {/* Header */}
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
          <Coins className="w-5 h-5 text-emerald-400" />
          Créditos
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Gestiona tus créditos para generar licencias y usuarios.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-blue-500 bg-blue-500/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Saldo Disponible</div>
            <div className="text-3xl font-black mt-1 font-mono text-blue-400">
              {isUnlimited ? "∞" : credits?.toFixed(1) ?? "0.0"}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">{isUnlimited ? "Plan ilimitado" : "Créditos restantes"}</div>
          </div>
          <Wallet className="w-8 h-8 opacity-40 text-blue-400" />
        </div>

        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-orange-500 bg-orange-500/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Costo Por Usuario/Licencia</div>
            <div className="text-3xl font-black mt-1 font-mono text-orange-400">{isUnlimited ? "Gratis" : "35"}</div>
            <div className="text-[10px] text-zinc-500 mt-1">{isUnlimited ? "Sin costo (suscripción)" : "Créditos por creación"}</div>
          </div>
          <TrendingUp className="w-8 h-8 opacity-40 text-orange-400" />
        </div>

        <div className="rounded-lg border border-zinc-800/80 p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Estado</div>
            <div className="text-xl font-black mt-1 font-mono text-emerald-400">{isUnlimited ? "Ilimitado" : "Gratuito"}</div>
            <div className="text-[10px] text-zinc-500 mt-1">Plan actual</div>
          </div>
          <Crown className="w-8 h-8 opacity-40 text-emerald-400" />
        </div>
      </div>

      {/* CTA to buy subscription */}
      {!isUnlimited && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-zinc-100">Obtén acceso ilimitado</h2>
          </div>
          <p className="text-xs text-zinc-500 max-w-lg">
            Con una suscripción tendrás usuarios y licencias ilimitadas, sin costo de créditos y máscara personalizable.
          </p>
          <div className="flex gap-3">
            <Link
              href="/dashboard/buy-subscription"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition"
            >
              Ver planes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Unlimited Banner */}
      {isUnlimited && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-2">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-300">Plan Ilimitado Activo</h2>
          </div>
          <p className="text-xs text-emerald-400/70">Tu cuenta tiene acceso ilimitado. No necesitas créditos para generar licencias ni usuarios.</p>
        </div>
      )}

      {/* Transaction History placeholder */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100">Historial de Transacciones</h3>
        </div>
        <div className="py-16 text-center">
          <Coins className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-400">No hay transacciones aún</p>
          <p className="text-xs text-zinc-500 mt-1">Las transacciones de créditos aparecerán aquí.</p>
        </div>
      </div>
    </div>
  );
}
