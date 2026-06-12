import { NextRequest } from "next/server";
import { requireAdmin, safeRoute } from "@/lib/api-helpers";
import { store } from "@/lib/store";
import { generateKey } from "@/lib/utils";
import { getScopedAppIds, checkQuota, hasUnlimitedQuota } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return safeRoute(async () => {
    const me = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const appId = String(body?.appId || "");
    const count = Math.min(Math.max(parseInt(String(body?.count || 1)) || 1, 1), 500);
    const durationDays = body?.durationDays === 0 || body?.durationDays === "lifetime"
      ? 36500
      : Math.max(parseInt(String(body?.durationDays ?? 30)) || 30, 1);
    const level = Math.max(parseInt(String(body?.level || 1)) || 1, 1);
    const maxUses = Math.max(parseInt(String(body?.maxUses || 1)) || 1, 1);
    const hwidLock = !!body?.hwidLock;
    const ipLock = !!body?.ipLock;
    const prefix = String(body?.prefix || "Guate Xiter").replace(/[^a-zA-Z0-9\-_ ]/g, "").trim() || "Guate Xiter";
    const suffix = String(body?.suffix || "****-****-****-****").replace(/[^a-zA-Z0-9\-_*]/g, "").trim() || "****-****-****-****";
    const packageName = String(body?.packageName || "Bypass").trim() || "Bypass";
    const note = String(body?.note || "").trim();

    if (!appId) return { status: 400, data: { success: false, message: "appId required" } };

    const app = await store.getAppById(appId);
    if (!app) return { status: 404, data: { success: false, message: "App not found" } };

    const scopedIds = await getScopedAppIds(me);
    if (scopedIds !== null && !scopedIds.includes(appId)) {
      return { status: 403, data: { success: false, message: "Forbidden" } };
    }

    const quota = await checkQuota(me, appId);
    if (!quota.ok) {
      return { status: 403, data: { success: false, message: quota.reason } };
    }
    if (quota.limit < Infinity && quota.licenses + count > quota.limit) {
      return { status: 403, data: { success: false, message: `License limit is ${quota.limit}. You have ${quota.licenses} and tried to add ${count}.` } };
    }

    const unlimited = await hasUnlimitedQuota(me.id);
    if (!unlimited) {
      const fullAdmin = await store.getAdminById(me.id);
      const cost = count * 35;
      const currentCredits = fullAdmin?.credits ?? 0;
      if (currentCredits < cost) {
        return { status: 403, data: { success: false, message: `Need ${cost} coins, you have ${currentCredits}. Each license costs 35 coins.` } };
      }
      await store.updateAdmin(me.id, { ...fullAdmin!, credits: currentCredits - cost });
    }

    const items = Array.from({ length: count }).map(() => {
      const segs = suffix.split("-").map((seg) =>
        seg.replace(/\*/g, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)))
      );
      const key = prefix ? `${prefix}-${segs.join("-")}` : segs.join("-");
      return {
        app_id: appId,
        key,
        duration_days: durationDays,
        level,
        uses: 0,
        max_uses: maxUses,
        hwid_lock: hwidLock,
        ip_lock: ipLock,
        status: "unused" as const,
        used_by: null,
        activated_at: null,
        expires_at: null,
        created_by: me.id,
        package_name: packageName,
        note,
      } as any;
    });
    const created = await store.createLicenses(items);
    return { data: { success: true, data: { keys: created.map((l) => l.key) } } };
  });
}

export async function GET(req: NextRequest) {
  return safeRoute(async () => {
    const me = await requireAdmin();
    const appId = new URL(req.url).searchParams.get("app") || undefined;
    const scopedIds = await getScopedAppIds(me);
    const all = await store.listLicenses({ appId, limit: 200 });
    const filtered = scopedIds ? all.filter((l) => scopedIds.includes(l.app_id)) : all;
    return { data: { success: true, data: filtered } };
  });
}
