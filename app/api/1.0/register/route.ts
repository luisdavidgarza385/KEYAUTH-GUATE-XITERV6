import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store } from "@/lib/store";
import { getClientIp } from "@/lib/utils";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      const text = await req.text();
      try { body = JSON.parse(text); }
      catch { body = Object.fromEntries(new URLSearchParams(text)); }
    } catch {}
    const url = new URL(req.url);
    const appId = body.appid || url.searchParams.get("appid");
    const sessionId = body.sessionid || url.searchParams.get("sessionid");
    const username = body.username || url.searchParams.get("username");
    const password = body.pass || body.password || url.searchParams.get("pass") || url.searchParams.get("password");
    const email = body.email || url.searchParams.get("email") || null;
    const license = body.key || url.searchParams.get("key");
    const hwid = body.hwid || url.searchParams.get("hwid") || null;

    if (!appId || !username || !password) return json({ success: false, message: "appid, username, password required" }, 400);
    if (!sessionId) return json({ success: false, message: "sessionid required" }, 400);
    if (!license) return json({ success: false, message: "License key required" }, 400);

    const app = await store.getAppByAppId(String(appId));
    if (!app) return json({ success: false, message: "Application not found" }, 404);

    const secret = body.secret || req.headers.get("x-secret") || url.searchParams.get("secret");
    if (secret && secret !== app.app_secret) return json({ success: false, message: "Invalid application secret" }, 401);

    const session = await store.getSession(String(sessionId));
    if (!session || session.app_id !== app.id) return json({ success: false, message: "Invalid session" }, 401);

    const existing = await store.getAppUser(app.id, String(username));
    if (existing) return json({ success: false, message: "Username already exists" }, 409);

    const lic = await store.getLicenseByKey(app.id, String(license));
    if (!lic) return json({ success: false, message: "Invalid license key" }, 404);
    if (lic.status === "banned") return json({ success: false, message: "License is banned" }, 403);
    if (lic.uses >= lic.max_uses) return json({ success: false, message: "License has no uses left" }, 403);

    if (lic.hwid_lock && hwid && lic.used_by) {
      const prev = await store.getAppUserById(lic.used_by);
      if (prev?.hwid && prev.hwid !== hwid) {
        return json({ success: false, message: "License locked to a different HWID" }, 403);
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const ip = getClientIp(req);
    const user = await store.createAppUser({
      app_id: app.id,
      username: String(username),
      email,
      password_hash: passwordHash,
      hwid,
      ip,
      last_login: new Date().toISOString(),
      banned: false,
      ban_reason: null,
    });

    const now = new Date();
    const expires = new Date(now.getTime() + lic.duration_days * 86400000);
    await store.updateLicense(lic.id, {
      status: "used",
      used_by: user.id,
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      uses: lic.uses + 1,
    });
    await store.updateSession(String(sessionId), { user_id: user.id, hwid, ip });
    await store.createLog({ app_id: app.id, user_id: user.id, message: `registered ${username}`, level: "info" });

    return json({ success: true, data: { status: true, message: "Registered", username: user.username, expires_at: expires.toISOString() } });
  } catch {
    return json({ success: false, message: "Server error" }, 500);
  }
}
