import { store } from "@/lib/store";
import { requireAdmin, getScopedAppIds } from "@/lib/auth";
import { Users, Coins, Sparkles, LayoutDashboard, ChevronRight, Activity, Calendar, ShieldCheck, Mail, Code } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await requireAdmin();
  const fullAdmin = await store.getAdminById(me.id);
  const scopedIds = await getScopedAppIds(me);

  const [allApps, allLicenses, allUsers, allAdmins] = await Promise.all([
    store.listApps(),
    store.listLicenses({ limit: 10000 }),
    store.listAppUsers({ limit: 10000 }),
    store.listAdmins(),
  ]);

  // Filter apps, licenses and users belonging to this reseller
  const apps = scopedIds === null ? allApps : allApps.filter((a) => scopedIds.includes(a.id));
  
  // Find sub-resellers created by this admin
  const subResellers = allAdmins.filter((a) => a.created_by === me.id);
  const subResellerIds = subResellers.map((sr) => sr.id);

  // Licenses created by me or my sub-resellers
  const myLicenses = allLicenses.filter((l) => l.created_by === me.id);
  const subLicenses = allLicenses.filter((l) => l.created_by && subResellerIds.includes(l.created_by));
  const totalLicensesCount = myLicenses.length + subLicenses.length;

  // Active users registered with my licenses or my sub-resellers' licenses
  const myLicenseUserIds = myLicenses.filter((l) => l.used_by).map((l) => l.used_by);
  const subLicenseUserIds = subLicenses.filter((l) => l.used_by).map((l) => l.used_by);
  
  const activeUsers = allUsers.filter((u) => myLicenseUserIds.includes(u.id) || subLicenseUserIds.includes(u.id));
  const activeUsersCount = activeUsers.length;

  // Unique package names
  const uniquePackages = new Set(
    allLicenses
      .filter((l) => l.app_id && (scopedIds === null || scopedIds.includes(l.app_id)))
      .map((l) => l.package_name || "Bypass")
  );
  const packagesCount = uniquePackages.size || 2;

  // Account Information details
  const username = me.email.includes("@") ? me.email.split("@")[0] : me.email;
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);
  
  const userLimit = 1000;
  const remainingSlots = Math.max(0, userLimit - activeUsersCount);
  const usePercentage = Math.min(100, Math.round((activeUsersCount / userLimit) * 100));

  const createdDate = fullAdmin?.created_at
    ? new Date(fullAdmin.created_at).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const lastAccess = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const credits = typeof fullAdmin?.credits === "number" ? fullAdmin.credits : 0.0;
  const hasSub = fullAdmin?.subscription_end ? new Date(fullAdmin.subscription_end).getTime() > Date.now() : false;
  const isUnlimited = fullAdmin?.role === "developer" || hasSub;
  const subDays = fullAdmin?.subscription_end
    ? Math.max(0, Math.ceil((new Date(fullAdmin.subscription_end).getTime() - Date.now()) / 86400000))
    : 0;

  const stats = [
    {
      label: "USUARIOS ACTIVOS",
      value: activeUsersCount,
      icon: Users,
      color: "border-l-4 border-green-500 bg-green-500/5 text-green-400",
      sub: "Clientes registrados"
    },
    {
      label: "SALDO DISPONIBLE",
      value: isUnlimited ? "Ilimitado" : credits.toFixed(1),
      icon: Coins,
      color: "border-l-4 border-blue-500 bg-blue-500/5 text-blue-400",
      sub: isUnlimited ? "Plan sin costo" : "Monedas disponibles"
    },
    {
      label: "COSTO X USUARIO/LICENCIA",
      value: isUnlimited ? "Gratis" : "35",
      icon: Coins,
      color: "border-l-4 border-orange-500 bg-orange-500/5 text-orange-400",
      sub: isUnlimited ? "Sin costo" : "Monedas por creación"
    },
    {
      label: "PAQUETES",
      value: packagesCount,
      icon: Sparkles,
      color: "border-l-4 border-purple-500 bg-purple-500/5 text-purple-400",
      sub: "Planes activos"
    }
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto text-zinc-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-5">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Resumen general y estado de tu cuenta de reseller.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span>Consola</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
          <span className="text-emerald-400 font-medium">Dashboard</span>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-lg border border-zinc-800/80 p-5 flex items-center justify-between ${s.color}`}>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{s.label}</div>
              <div className="text-2xl font-black mt-1 font-mono">{s.value}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{s.sub}</div>
            </div>
            <s.icon className="w-8 h-8 opacity-40 shrink-0" />
          </div>
        ))}
      </div>

      {/* Account Info Box */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Información de la cuenta
          </h2>
          {hasSub ? (
            <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Suscripción activa
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Plan gratuito
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Usuario</div>
            <div className="font-semibold text-zinc-200">{capitalizedUsername}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Límite Usuarios</div>
            <div className="font-semibold text-zinc-200 font-mono">
              {activeUsersCount} / {userLimit}
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Licencias</div>
            <div className="font-semibold text-zinc-200 font-mono">
              {totalLicensesCount} <span className="text-zinc-500 text-xs">(tuya + sub)</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Restante</div>
            <div className="font-semibold text-zinc-200 font-mono">
              {remainingSlots} <span className="text-zinc-500 text-xs">({100 - usePercentage}%)</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Creada</div>
            <div className="font-semibold text-zinc-200 font-mono text-xs">{createdDate}</div>
          </div>
          <div>
            <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Último Acceso</div>
            <div className="font-semibold text-zinc-200 font-mono text-xs">{lastAccess}</div>
          </div>
          {hasSub && (
            <div>
              <div className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">Suscripción</div>
              <div className="font-semibold text-emerald-400 font-mono text-xs">{subDays}d restantes</div>
            </div>
          )}
        </div>

        {/* User limit progress bar */}
        <div className="space-y-2 pt-2">
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/40">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500 shadow-sm shadow-emerald-500/50"
              style={{ width: `${usePercentage}%` }}
            />
          </div>
          <div className="text-right text-[10px] font-mono text-zinc-500">
            {usePercentage}% del límite de usuarios en uso
          </div>
        </div>
      </div>

      {/* Quick Access panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Acciones Rápidas
          </h3>
          <p className="text-xs text-zinc-500">Accesos directos a las herramientas de administración frecuentes.</p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/dashboard/licenses" className="flex items-center justify-between p-3 rounded bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900 hover:border-zinc-700 transition text-xs font-medium">
              <span>Administrar Licencias</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
            <Link href="/dashboard/sub-resellers" className="flex items-center justify-between p-3 rounded bg-zinc-900/40 border border-zinc-800/40 hover:bg-zinc-900 hover:border-zinc-700 transition text-xs font-medium">
              <span>Crear Sub-reseller</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-5 space-y-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Información del Desarrollador
          </h3>
          <p className="text-xs text-zinc-500">Aplicaciones administradas activas en el sistema.</p>
          <div className="divide-y divide-zinc-800/50">
            {apps.length === 0 ? (
              <div className="text-xs text-zinc-500 py-2">No hay aplicaciones asignadas.</div>
            ) : (
              apps.slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="text-xs font-medium text-zinc-300">{app.name}</div>
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    v{app.version}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mail / Project Integration Section */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-100">Integración para tu proyecto</h3>
        </div>
        <p className="text-xs text-zinc-500">
          Agrega estos datos en el código de tu aplicación para conectar con KeyAuth.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Datos del proyecto</h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Owner ID:</span>
                <span className="text-zinc-300">{fullAdmin?.id || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-300">{me.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rol:</span>
                <span className="text-zinc-300">{me.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Créditos:</span>
                <span className="text-zinc-300">{isUnlimited ? "Ilimitados" : credits}</span>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-4 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Configuración del SDK</h4>
            <div className="space-y-1.5 text-xs font-mono">
              <p className="text-zinc-500">En tu aplicación usa:</p>
              <pre className="bg-zinc-950 border border-zinc-800 rounded p-2 text-[11px] text-emerald-300 overflow-x-auto">
{`KeyAuth App = new KeyAuth(
  "APP_NAME",
  "APP_ID",
  "APP_SECRET",
  "1.0"
);`}</pre>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            Endpoints de la API
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-16 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-zinc-400">/api/1.0/init</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-zinc-400">/api/1.0/login</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-zinc-400">/api/1.0/register</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">POST</span>
              <span className="text-zinc-400">/api/1.0/license</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
