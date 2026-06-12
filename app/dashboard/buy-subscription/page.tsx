"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Check, Sparkles, CreditCard, Loader2, ChevronRight, Calendar, Infinity } from "lucide-react";
import dynamic from "next/dynamic";

const PayPalCheckout = dynamic(() => import("@/components/PayPalCheckout").then((m) => ({ default: m.PayPalCheckout })), { ssr: false });

const PACKAGES = [
  { id: "monthly", label: "Mensual", price: 4, subDays: 30, popular: false },
  { id: "yearly", label: "Anual", price: 15, subDays: 365, popular: true },
];

export default function BuySubscriptionPage() {
  const router = useRouter();
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto space-y-6 text-zinc-300">
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <Crown className="w-5 h-5 text-amber-400" />
            Comprar Suscripción
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Obtén acceso ilimitado a todas las funciones.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>Consola</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
          <span className="text-amber-400 font-medium">Suscripción</span>
        </div>
      </div>

      {/* Benefits banner */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-5 text-amber-400" />
          Todo incluido
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-300"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Usuarios y licencias ilimitados</div>
          <div className="flex items-center gap-2 text-zinc-300"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Sin costo de coins por creación</div>
          <div className="flex items-center gap-2 text-zinc-300"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Máscara de licencia personalizable</div>
          <div className="flex items-center gap-2 text-zinc-300"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Acceso a sección de suscripción</div>
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        {PACKAGES.map((pkg) => {
          const pricePerMonth = pkg.id === "yearly" ? (pkg.price / 12).toFixed(2) : null;
          return (
            <div
              key={pkg.id}
              className={`rounded-xl border p-6 space-y-4 transition cursor-pointer ${
                selectedPkg === pkg.id
                  ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"
              }`}
              onClick={() => { setSelectedPkg(pkg.id); setMsg(null); }}
            >
              {pkg.popular && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">Más popular</span>
              )}
              <div className="space-y-1">
                <div className="text-3xl font-black text-zinc-100">${pkg.price}</div>
                {pricePerMonth && <div className="text-xs text-zinc-500">${pricePerMonth}/mes</div>}
              </div>
              <div className="text-lg font-bold text-zinc-200">{pkg.label}</div>
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> {pkg.subDays} días de acceso ilimitado</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Sin límites de cuota</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Sin costo por usuario/licencia</div>
              </div>
              {selectedPkg === pkg.id && (
                <div className="pt-2 border-t border-zinc-800">
                  <PayPalCheckout
                    pkgId={pkg.id}
                    amount={String(pkg.price)}
                    description={`Suscripción ${pkg.label} - ${pkg.subDays}d acceso ilimitado`}
                    onSuccess={(data) => {
                      setMsg({ type: "ok", text: data.message || "Suscripción activada!" });
                      setSelectedPkg(null);
                      setTimeout(() => router.refresh(), 2000);
                    }}
                    onError={(err) => setMsg({ type: "err", text: err })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message */}
      {msg && (
        <div className={`text-xs px-4 py-3 rounded-lg max-w-xl ${msg.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {msg.text}
        </div>
      )}

      {/* PayPal.me alternative */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-4 flex items-center justify-between max-w-xl">
        <div className="text-xs text-zinc-400">
          <span className="font-bold text-zinc-300">¿Sin tarjeta?</span> Donación vía PayPal.me.
        </div>
        <a href="https://www.paypal.com/paypalme/david639935/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition">
          <CreditCard className="w-3.5 h-3.5" /> PayPal.me
        </a>
      </div>
    </div>
  );
}
