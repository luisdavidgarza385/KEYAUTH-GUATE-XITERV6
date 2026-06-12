"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Key,
  Users,
  Coins,
  Lock,
  Code,
  LogOut,
  Moon,
  Sun,
  Shield,
  Layers,
  Terminal,
  UserCheck,
  Crown,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "GENERAL",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
      { href: "/dashboard/buy-subscription", label: "Comprar Suscripción", icon: CreditCard, adminOnly: false },
      { href: "/dashboard/apps", label: "Aplicaciones", icon: Shield, adminOnly: false },
    ],
  },
  {
    label: "GESTION",
    items: [
      { href: "/dashboard/licenses", label: "Licencias", icon: Key, adminOnly: false },
      { href: "/dashboard/users", label: "Users", icon: UserCheck, adminOnly: false },
      { href: "/dashboard/sub-resellers", label: "Sub resellers", icon: Users, subOnly: true },
      { href: "/dashboard/sub-users", label: "Sub-usuarios", icon: Layers, subOnly: true },
      { href: "/dashboard/credits", label: "Créditos", icon: Coins, adminOnly: false },
    ],
  },
  {
    label: "SUSCRIPCIÓN",
    items: [
      { href: "/dashboard/subscriptions", label: "Subscriptions", icon: Crown, adminOnly: false },
    ],
  },
  {
    label: "ADMIN CREDITOS",
    items: [
      { href: "/dashboard/admin-creditos", label: "Admin Créditos", icon: Crown, adminOnly: false },
    ],
  },
  {
    label: "CUENTA",
    items: [
      { href: "/dashboard/security", label: "Seguridad (2FA)", icon: Lock, adminOnly: false },
      { href: "/dashboard/api", label: "API", icon: Code, adminOnly: false },
    ],
  },
];

export function Sidebar({ role, email, hasSubscription }: { role: "admin" | "seller" | "developer"; email: string; hasSubscription?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = role === "admin" || role === "developer";
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("gx-theme");
    if (stored === "light") {
      setDark(false);
      document.documentElement.classList.add("light");
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("gx-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("gx-theme", "light");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Extract clean username (e.g. xDavid for xdavid@example.com or xdavid)
  const username = email.includes("@") ? email.split("@")[0] : email;
  const capitalizedUsername = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <aside className="w-60 border-r border-zinc-800 bg-[#09090b] flex flex-col h-screen sticky top-0 text-zinc-300">
      <div className="p-5 flex items-center justify-center border-b border-zinc-800/60">
        <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
          GUATE XITER
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-5 px-3">
        {SECTIONS.map((section) => {
          if (section.label === "SUSCRIPCIÓN" && !hasSubscription && role !== "developer") return null;
          if (section.label === "ADMIN CREDITOS" && role !== "developer" && email !== "admcreditos") return null;
          const items = section.items.filter((i) => {
            if (i.adminOnly && !isAdmin) return false;
            if ((i as any).subOnly && !hasSubscription && role !== "developer") return false;
            return true;
          });
          if (items.length === 0) return null;
          return (
            <div key={section.label} className="mb-5">
              <div className="px-3 py-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                {section.label}
              </div>
              <div className="mt-1.5 space-y-0.5">
                {items.map((n) => {
                  const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href));
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
                        active
                          ? "bg-emerald-950/20 text-emerald-400 border-l-2 border-emerald-500 pl-2.5"
                          : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border-l-2 border-transparent"
                      )}
                    >
                      <n.icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-400" : "text-zinc-500")} />
                      <span className="truncate">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile Details */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="rounded-lg bg-zinc-900/60 border border-zinc-800/60 p-3 space-y-3">
          <div className="min-w-0">
            <div className="font-semibold text-sm text-zinc-100 truncate">{capitalizedUsername}</div>
            <div className="text-[11px] text-zinc-500 truncate font-mono">KeyAuth Pro</div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title={dark ? "Modo Claro" : "Modo Oscuro"}
            >
              {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-950/20 border border-red-900/30 text-[11px] font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
