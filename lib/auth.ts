import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { store } from "./store";
import crypto from "crypto";

export type AdminSession = {
  id: string;
  email: string;
  role: "admin" | "seller" | "developer";
};

const COOKIE_NAME = "ka_admin_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is not set. Add it to .env.local");
  }
  return secret;
}

function signSession(payload: string): string {
  const secret = getSessionSecret();
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

function verifySession(signed: string): string | null {
  try {
    const secret = getSessionSecret();
    const lastDot = signed.lastIndexOf(".");
    if (lastDot === -1) return null;
    const payload = signed.substring(0, lastDot);
    const signature = signed.substring(lastDot + 1);
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (signature !== expected) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const signed = cookieStore.get(COOKIE_NAME)?.value;
  if (!signed) return null;
  try {
    const payload = verifySession(signed);
    if (!payload) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export function setAdminSession(admin: AdminSession) {
  const payload = Buffer.from(JSON.stringify(admin)).toString("base64");
  const signed = signSession(payload);
  cookies().set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function signSessionValue(admin: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(admin)).toString("base64");
  return signSession(payload);
}

export function clearAdminSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getScopedAppIds(me: AdminSession): Promise<string[] | null> {
  if (me.role === "developer") return null;
  if (me.role === "admin") {
    const hasSub = await hasUnlimitedQuota(me.id);
    if (hasSub) return null;
  }
  const apps = await store.listApps({ ownerId: me.id });
  return apps.map((a) => a.id);
}

export async function canAccessApp(me: AdminSession, appId: string): Promise<boolean> {
  if (me.role === "admin" || me.role === "developer") return true;
  const apps = await store.listApps({ sellerId: me.id });
  return apps.some((a) => a.id === appId);
}

export async function hasUnlimitedQuota(adminId: string): Promise<boolean> {
  const admin = await store.getAdminById(adminId);
  if (!admin) return false;
  if (admin.role === "developer") return true;
  if (admin.subscription_end && new Date(admin.subscription_end).getTime() > Date.now()) return true;
  return false;
}

export const QUOTA_LIMIT = 50;

export async function checkQuota(me: AdminSession, appId: string): Promise<{ ok: boolean; reason?: string; users: number; licenses: number; limit: number }> {
  const unlimited = await hasUnlimitedQuota(me.id);
  if (unlimited) {
    return { ok: true, users: 0, licenses: 0, limit: 9999 };
  }
  const [users, licenses] = await Promise.all([
    store.listAppUsers({ appId, limit: 1000 }),
    store.listLicenses({ appId, limit: 1000 }),
  ]);
  if (users.length >= QUOTA_LIMIT) {
    return { ok: false, reason: `User limit reached (${QUOTA_LIMIT} per app). Ask the developer to increase your quota.`, users: users.length, licenses: licenses.length, limit: QUOTA_LIMIT };
  }
  if (licenses.length >= QUOTA_LIMIT) {
    return { ok: false, reason: `License limit reached (${QUOTA_LIMIT} per app). Ask the developer to increase your quota.`, users: users.length, licenses: licenses.length, limit: QUOTA_LIMIT };
  }
  return { ok: true, users: users.length, licenses: licenses.length, limit: QUOTA_LIMIT };
}
