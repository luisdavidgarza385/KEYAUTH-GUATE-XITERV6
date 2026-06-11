import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getClientIp, generateId } from "@/lib/utils";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

function sanitize(val: string): string {
  return val.replace(/[<>&"']/g, (c) => ({ "<": " ", ">": " ", "&": " ", '"': " ", "'": " " })[c] || c);
}

function secureId(length = 48): string {
  return crypto.randomBytes(Math.ceil(length * 6 / 8))
    .toString("base64url")
    .slice(0, length)
    .replace(/[^a-zA-Z0-9]/g, "A");
}

function xorDecrypt(hexData: string, key: string): string {
  const buf = Buffer.from(hexData, "hex");
  const keyBuf = Buffer.from(key, "utf-8");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ keyBuf[i % keyBuf.length];
  }
  return out.toString("utf-8");
}
function hex2bin(hex: string): string {
  try { return Buffer.from(hex, "hex").toString("utf-8"); } catch { return hex; }
}

const MAX_BODY_SIZE = 10_000;

async function getParams(req: NextRequest): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  const text = await req.text();
  if (text.length > MAX_BODY_SIZE) return {};
  const params: Record<string, string> = {};

  if (!ct.includes("application/json") && text.length < 2000) {
    console.log("[RAW BODY]", text);
  }

  if (ct.includes("application/json")) {
    try { return JSON.parse(text); } catch {}
  }
  try {
    const sp = new URLSearchParams(text);
    for (const [k, v] of sp) params[k] = v;
  } catch {}
  let hexEncoded = true;
  for (const v of Object.values(params)) {
    if (v.length > 0 && !/^[0-9a-fA-F]+$/.test(v)) { hexEncoded = false; break; }
  }
  if (hexEncoded && Object.keys(params).length > 0) {
    console.log("[HEX ENCODED DETECTED]", params);
    const decoded: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      decoded[k] = hex2bin(v);
    }
    for (const [k, v] of Object.entries(decoded)) {
      params[k] = v;
    }
  }
  if (params["data"] && params["sessionid"]) {
    const session = sessionsMap.get(params["sessionid"]);
    if (session && session.enckey) {
      const decrypted = xorDecrypt(params["data"], params["sessionid"] + session.enckey);
      try {
        const sp = new URLSearchParams(decrypted);
        for (const [k, v] of sp) params[k] = v;
      } catch {}
    }
  }
  for (const [k, v] of new URL(req.url).searchParams) {
    if (!params[k]) params[k] = v;
  }
  return params;
}

const sessionsMap = new Map<string, any>();
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function cleanExpiredSessions(): void {
  if (cleanExpiredSessions.lastClean && Date.now() - cleanExpiredSessions.lastClean < 60_000) return;
  cleanExpiredSessions.lastClean = Date.now();
  const now = new Date();
  for (const [id, s] of sessionsMap) {
    if (new Date(s.expires_at) < now) sessionsMap.delete(id);
  }
}
cleanExpiredSessions.lastClean = 0;

function checkRateLimit(ip: string, maxReqs = 20, windowMs = 10_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxReqs) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 30_000);

function sanitizeMessage(msg: string): string {
  return msg.replace(/[<>&"']/g, "");
}

function safeError(msg: string): string {
  return msg.replace(/(route\.ts|Error:|at\s+|\n|\r)/gi, "").slice(0, 200);
}

export async function POST(req: NextRequest) {
  try {
    const p = await getParams(req);
    const type = p.type;
    const ip = getClientIp(req);

    if (!checkRateLimit(ip)) {
      return json({ success: false, message: "Too many requests. Try again later." }, 429);
    }

    if (type === "init") {
      const name = p.name;
      const ownerid = p.ownerid;
      const appId = p.appid || ownerid;

      let app: any = null;
      if (name) app = await store.getAppByName(String(name));
      if (!app && appId) app = await store.getAppByAppId(String(appId));
      if (!app) return json({ success: false, message: "Application not found" }, 404);

      const secretFromHeader = req.headers.get("x-secret");
      const effectiveSecret = p.secret || secretFromHeader;
      if (effectiveSecret && effectiveSecret !== app.app_secret) return json({ success: false, message: "Invalid application secret" }, 401);
      if (app.status !== "active") return json({ success: false, message: "Application is " + app.status }, 403);

      const sessionId = secureId(48);
      const enckey = secureId(64);
      const nonce = secureId(16);
      const expires = new Date(Date.now() + 86400000);
      sessionsMap.set(sessionId, { app_id: app.id, user_id: null, ip, hwid: p.hwid || null, enckey, expires_at: expires.toISOString(), valid: true });
      await store.createLog({ app_id: app.id, user_id: null, message: `init from ${ip}`, level: "info" });

      const allLicenses = await store.listLicenses({ appId: app.id });
      const allUsers = await store.listAppUsers({ appId: app.id });
      const numKeys = allLicenses.length;
      const numUsers = allUsers.length;
      const numOnline = allUsers.filter((u: any) => u.last_login && Date.now() - new Date(u.last_login).getTime() < 300000).length;

      const appInfoData = {
        name: app.name,
        version: app.version,
        download_link: app.download_link || "",
        numUsers: String(numUsers),
        numOnlineUsers: String(numOnline),
        numKeys: String(numKeys),
        customerPanelLink: "",
      };
      const userData = {
        username: "",
        ip: "",
        hwid: "",
        createdate: "",
        lastlogin: "",
        subscription: "",
        expiry: "",
      };
      cleanExpiredSessions();
      return json({
        success: true,
        sessionid: sessionId,
        message: "",
        ownerid: app.app_id,
        appinfo: appInfoData,
        subscriptions: [],
        userdata: userData,
        nonce,
        enckey,
      });
    }

    if (type === "login") {
      const appId = p.appid || p.ownerid;
      const sessionId = p.sessionid;
      const username = p.username;
      const password = p.pass || p.password;
      const hwid = p.hwid || null;

      if (!appId || !username || !password) return json({ success: false, message: "appid, username, password required" }, 400);
      if (!sessionId) return json({ success: false, message: "sessionid required" }, 400);

      const app = await store.getAppByAppId(String(appId));
      if (!app) return json({ success: false, message: "Application not found" }, 404);
      const secretFromHeader2 = req.headers.get("x-secret");
      const effectiveSecret2 = p.secret || secretFromHeader2;
      if (effectiveSecret2 && effectiveSecret2 !== app.app_secret) return json({ success: false, message: "Invalid application secret" }, 401);

      const session = sessionsMap.get(String(sessionId));
      if (!session || session.app_id !== app.id) return json({ success: false, message: "Invalid session" }, 401);

      const user = await store.getAppUser(app.id, String(username));
      if (!user) return json({ success: false, message: "Invalid credentials" }, 401);
      if (user.banned) return json({ success: false, message: "You are banned" }, 403);

      const valid = await bcrypt.compare(String(password), user.password_hash);
      if (!valid) return json({ success: false, message: "Invalid credentials" }, 401);

      await store.updateAppUser(user.id, { last_login: new Date().toISOString(), ip, hwid: hwid || user.hwid });
      await store.updateSession(String(sessionId), { user_id: user.id, hwid, ip });
      await store.createLog({ app_id: app.id, user_id: user.id, message: `login ${username}`, level: "info" });

      return json({
        success: true,
        message: "Logged in",
        info: {
          username: user.username,
          ip,
          hwid: hwid || user.hwid || "",
          createdate: user.created_at || "",
          lastlogin: user.last_login || "",
          expiry: "0",
          subscriptions: [],
          role: "user",
          balance: String(user.balance || 0),
        },
      });
    }

    if (type === "register") {
      const appId = p.ownerid || p.appid;
      const sessionId = p.sessionid;
      const username = sanitize(p.username || "");
      const password = p.pass || p.password;
      const key = p.key;
      const hwid = p.hwid || null;

      if (!appId || !username || !password) return json({ success: false, message: "appid, username, password required" }, 400);
      if (!sessionId) return json({ success: false, message: "sessionid required" }, 400);
      if (!key) return json({ success: false, message: "License key required" }, 400);
      if (username.length < 3 || username.length > 32) return json({ success: false, message: "Username must be 3-32 characters" }, 400);
      if (password.length < 4 || password.length > 128) return json({ success: false, message: "Password must be 4-128 characters" }, 400);

      const app = await store.getAppByAppId(String(appId));
      if (!app) return json({ success: false, message: "Application not found" }, 404);
      if (app.status !== "active") return json({ success: false, message: "Application is " + app.status }, 403);

      const session = sessionsMap.get(String(sessionId));
      if (!session || session.app_id !== app.id) return json({ success: false, message: "Invalid session" }, 401);

      const existing = await store.getAppUser(app.id, String(username));
      if (existing) return json({ success: false, message: "Username already exists" }, 409);

      const lic = await store.getLicenseByKey(app.id, String(key));
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
      const user = await store.createAppUser({
        app_id: app.id,
        username: String(username),
        email: null,
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
      sessionsMap.set(String(sessionId), { ...session, user_id: user.id, hwid, ip });
      await store.createLog({ app_id: app.id, user_id: user.id, message: `registered ${username}`, level: "info" });

      return json({
        success: true, message: "Registered", username: user.username, expires_at: expires.toISOString(),
        info: {
          username: user.username,
          ip: user.ip,
          hwid: user.hwid,
          createdate: user.created_at,
          lastlogin: user.last_login,
          expires_at: expires.toISOString(),
          subscriptions: [{ subscription: lic.level || "default", expiry: expires.toISOString() }],
        },
      });
    }

    if (type === "license") {
      const appId = p.ownerid || p.appid;
      const sessionId = p.sessionid;
      const key = p.key;
      const hwid = p.hwid || null;

      if (!appId || !key) return json({ success: false, message: "appid and key required" }, 400);
      if (!sessionId) return json({ success: false, message: "sessionid required" }, 400);

      const app = await store.getAppByAppId(String(appId));
      if (!app) return json({ success: false, message: "Application not found" }, 404);
      if (app.status !== "active") return json({ success: false, message: "Application is " + app.status }, 403);

      const session = sessionsMap.get(String(sessionId));
      if (!session || session.app_id !== app.id) return json({ success: false, message: "Invalid session" }, 401);

      const lic = await store.getLicenseByKey(app.id, String(key));
      if (!lic) return json({ success: false, message: "Invalid license" }, 404);
      if (lic.status === "banned") return json({ success: false, message: "License banned" }, 403);
      if (lic.uses >= lic.max_uses) return json({ success: false, message: "No uses left" }, 403);

      if (lic.hwid_lock && hwid && lic.used_by) {
        const prev = await store.getAppUserById(lic.used_by);
        if (prev?.hwid && prev.hwid !== hwid) {
          return json({ success: false, message: "HWID mismatch" }, 403);
        }
      }

      const now = new Date();
      let expiresAt = lic.expires_at ? new Date(lic.expires_at) : null;
      if (!expiresAt || expiresAt < now) {
        expiresAt = new Date(now.getTime() + lic.duration_days * 86400000);
        await store.updateLicense(lic.id, {
          status: "used",
          used_by: lic.used_by || session.user_id,
          activated_at: lic.activated_at || now.toISOString(),
          expires_at: expiresAt.toISOString(),
          uses: lic.uses + 1,
        });
      } else if (session.user_id) {
        await store.updateLicense(lic.id, { uses: lic.uses + 1 });
      }

      await store.createLog({ app_id: app.id, user_id: session.user_id, message: `license valid ${key}`, level: "info" });

      let licUser = null;
      if (lic.used_by) licUser = await store.getAppUserById(lic.used_by);
      if (!licUser && session.user_id) licUser = await store.getAppUserById(session.user_id);
      const info = licUser ? {
        username: licUser.username,
        ip: licUser.ip,
        hwid: licUser.hwid,
        createdate: licUser.created_at,
        lastlogin: licUser.last_login,
        expires_at: expiresAt.toISOString(),
        subscriptions: [{ subscription: lic.level || "default", expiry: expiresAt.toISOString() }],
      } : {};
      return json({ success: true, message: "License valid", level: lic.level, expires_at: expiresAt.toISOString(), hwid, info });
    }

    if (type === "log" || type === "var") {
      return json({ success: false, message: "Endpoint not yet implemented: " + type }, 501);
    }

    return json({
      success: true,
      message: "KeyAuth API 1.0",
      endpoints: ["init", "login", "register", "license", "log", "var"],
    });
  } catch (e: any) {
    console.error("[API ERROR]", e?.message);
    return json({ success: false, message: "Internal server error" }, 500);
  }
}

export async function GET(req: NextRequest) {
  return json({
    success: true, message: "KeyAuth API 1.0",
    endpoints: ["init", "login", "register", "license", "log", "var"],
  });
}
