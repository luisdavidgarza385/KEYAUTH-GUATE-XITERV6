import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin, safeRoute } from "@/lib/api-helpers";
import { store } from "@/lib/store";
import { getScopedAppIds, checkQuota, hasUnlimitedQuota } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return safeRoute(async () => {
    const me = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const appId = String(body?.appId || "");
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const email = String(body?.email || "").trim() || null;

    if (!appId || !username || !password)
      return { status: 400, data: { success: false, message: "appId, username, password required" } };
    if (password.length < 1)
      return { status: 400, data: { success: false, message: "Password must be at least 1 character" } };
    if (username.length < 1 || username.length > 32)
      return { status: 400, data: { success: false, message: "Username must be 1-32 characters" } };

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

    const unlimited = await hasUnlimitedQuota(me.id);
    if (!unlimited) {
      const fullAdmin = await store.getAdminById(me.id);
      const currentCredits = fullAdmin?.credits ?? 0;
      if (currentCredits < 35) {
        return { status: 403, data: { success: false, message: `Need 35 coins to create a user, you have ${currentCredits}.` } };
      }
      await store.updateAdmin(me.id, { ...fullAdmin!, credits: currentCredits - 35 });
    }

    const existing = await store.getAppUser(appId, username);
    if (existing) return { status: 409, data: { success: false, message: "Username already exists in this app" } };

    const hash = await bcrypt.hash(password, 10);
    const user = await store.createAppUser({
      app_id: appId,
      username,
      email,
      password_hash: hash,
      hwid: null,
      ip: null,
      last_login: null,
      banned: false,
      ban_reason: null,
    });
    return { data: { success: true, data: user } };
  });
}
