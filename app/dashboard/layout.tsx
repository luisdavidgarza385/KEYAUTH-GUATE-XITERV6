import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const allApps = await store.listApps({ ownerId: me.id });
  const fullAdmin = await store.getAdminById(me.id);
  const hasSub = fullAdmin?.subscription_end ? new Date(fullAdmin.subscription_end).getTime() > Date.now() : false;
  return (
    <div className="theme-vyper flex min-h-screen bg-bg text-text">
      <Sidebar role={me.role} email={me.email} hasSubscription={hasSub} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader email={me.email} role={me.role} apps={allApps} hasSubscription={hasSub} subDays={fullAdmin?.subscription_end ? Math.max(0, Math.ceil((new Date(fullAdmin.subscription_end).getTime() - Date.now()) / 86400000)) : 0} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
