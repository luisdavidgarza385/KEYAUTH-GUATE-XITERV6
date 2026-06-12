import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { store } from "@/lib/store";
import { CreateMenu, CreateAppInlineButton } from "@/components/CreateMenu";
import { getScopedAppIds } from "@/lib/auth";
import { cookies } from "next/headers";

interface Props {
  current?: { label: string; href?: string };
  showCreate?: boolean;
  apps?: { id: string; name: string }[];
  currentAppId?: string;
}

export async function TopBar({ current, showCreate = true, apps, currentAppId }: Props) {
  const list = apps ?? (await store.listApps());
  const cookieStore = await cookies();
  const cookieApp = cookieStore.get("ka_current_app")?.value;
  const explicitId = currentAppId || cookieApp;
  const firstApp = list.find((a) => a.id === explicitId) || list[0];
  return (
    <div className="flex items-center justify-between gap-4 px-8 py-3 border-b border-border bg-bg-secondary/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm flex-wrap min-w-0">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-text-muted hover:text-text transition">
          <Home className="w-3.5 h-3.5" />
          <span>Manage Apps</span>
        </Link>
        {firstApp && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
            <Link
              href={`/dashboard/apps/${firstApp.id}`}
              className="text-text-muted hover:text-text transition truncate max-w-[200px]"
            >
              Current Application: {firstApp.name}
            </Link>
          </>
        )}
        {current && (
          <>
            {current.href ? (
              <Link href={current.href} className="text-text font-medium ml-2">{current.label}</Link>
            ) : (
              <span className="text-text font-medium ml-2">{current.label}</span>
            )}
          </>
        )}
      </div>
      {showCreate && list.length > 0 && <CreateMenu apps={list} />}
      {showCreate && list.length === 0 && <CreateAppInlineButton label="Create Application" className="btn-primary text-sm" />}
    </div>
  );
}
