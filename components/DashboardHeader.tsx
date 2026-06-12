"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Search, ChevronDown, LogOut, User as UserIcon, Settings, Crown } from "lucide-react";

export function DashboardHeader({ email, role, apps, hasSubscription, subDays }: { email: string; role: string; apps: { id: string; name: string }[]; hasSubscription?: boolean; subDays?: number }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (email || "?").slice(0, 2).toUpperCase();
  const roleLabel = role === "developer" ? "Developer" : role === "admin" ? "Administrator" : "Manager";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 border-b border-border bg-bg-secondary/40 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20">
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-md overflow-hidden ring-1 ring-accent/30">
          <img src="/logo.png" alt="Guate Xiter" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-text to-text-muted bg-clip-text">Guate Xiter</span>
      </Link>

      <div className="flex-1 max-w-md mx-auto relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim pointer-events-none" />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-bg/50 border border-border rounded-md pl-9 pr-16 py-1.5 text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/40 focus:bg-bg/80 transition"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 text-[10px] text-text-dim font-mono bg-bg-secondary border border-border rounded px-1.5 py-0.5">
          Ctrl + K
        </kbd>
      </div>

      <button className="relative p-2 rounded-md hover:bg-bg-hover text-text-muted hover:text-text transition" aria-label="Notifications">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </button>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-md hover:bg-bg-hover transition"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-[13px] font-medium leading-tight">{email}</div>
            <div className="text-[10px] text-text-dim leading-tight">{roleLabel}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-text-dim" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-30 min-w-[200px] rounded-md border border-border bg-bg-card shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border">
              <div className="text-[13px] font-medium truncate">{email}</div>
              <div className="text-[10px] text-text-dim uppercase tracking-wider">{roleLabel}</div>
              {hasSubscription && subDays !== undefined && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 font-semibold">
                  <Crown className="w-3 h-3" /> {subDays}d restantes
                </div>
              )}
            </div>
            <Link href="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-muted hover:bg-bg-hover hover:text-text">
              <UserIcon className="w-3.5 h-3.5" /> Profile
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-muted hover:bg-bg-hover hover:text-text">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-muted hover:bg-danger/10 hover:text-danger border-t border-border"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
