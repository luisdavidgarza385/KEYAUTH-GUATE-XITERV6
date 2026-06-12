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
    const hwid = body.hwid || url.searchParams.get("hwid") || null;

    if (!appId || !username || !password) return json({ success: false, message: "appid, username, password required" }, 400);
    if (!sessionId) return json({ success: false, message: "sessionid required" }, 400);

    const app = await store.getAppByAppId(String(appId));
    if (!app) return json({ success: false, message: "Application not found" }, 404);

    const secret = body.secret || req.headers.get("x-secret") || url.searchParams.get("secret");
    if (secret && secret !== app.app_secret) return json({ success: false, message: "Invalid application secret" }, 401);

    const session = await store.getSession(String(sessionId));
    if (!session || session.app_id !== app.id) return json({ success: false, message: "Invalid session" }, 401);

    const user = await store.getAppUser(app.id, String(username));
    if (!user) return json({ success: false, message: "Invalid credentials" }, 401);

    if (user.banned) return json({ success: false, message: "You are banned: " + (user.ban_reason || "") }, 403);

    const valid = await bcrypt.compare(String(password), user.password_hash);

    const ip = getClientIp(req);
    await store.updateAppUser(user.id, {
      last_login: new Date().toISOString(),
      ip,
      hwid: hwid || user.hwid,
    });
    await store.updateSession(String(sessionId), { user_id: user.id, hwid, ip });
    await store.createLog({ app_id: app.id, user_id: user.id, message: `login ${username}`, level: "info" });

    return json({
      success: true,
      message: "Logged in",
      info: {
        username: user.username,
        ip,
        hwid,
        createdate: user.created_at,
        lastlogin: user.last_login,
        subscriptions: [],
        role: "user"
      }
    });
  } catch {
    return json({ success: false, message: "Server error" }, 500);
  }
}
