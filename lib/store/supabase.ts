import { supabaseAdmin } from "../supabase/admin";
import bcrypt from "bcryptjs";
import type {
  Admin,
  App,
  AppUser,
  License,
  Log,
  OAuthLink,
  Session,
  Store,
  Variable,
} from "./types";

function id(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

const db = () => supabaseAdmin() as any;

export const supabaseStore: Store = {
  async getAdminByEmail(email) {
    const { data } = await db()
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    return data as Admin | null;
  },

  async getAdminById(id) {
    const { data } = await db()
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data as Admin | null;
  },

  async createAdmin(data) {
    const { data: row, error } = await db()
      .from("admin_users")
      .insert({
        email: data.email,
        password_hash: data.password_hash,
        role: data.role,
        created_by: data.created_by || null,
        credits: data.credits || 0,
        status: data.status || "active",
        permissions: data.permissions || [],
        subscriptions: data.subscriptions || [],
      } as any)
      .select()
      .single();
    if (error) throw error;
    return row as Admin;
  },

  async updateAdmin(id, data) {
    const { data: row, error } = await db()
      .from("admin_users")
      .update(data)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return (row as Admin) || null;
  },

  async deleteAdmin(id) {
    const { error } = await db().from("admin_users").delete().eq("id", id);
    if (error) throw error;
  },

  async listAdmins() {
    const { data } = await db().from("admin_users").select("*");
    return (data || []) as Admin[];
  },

  async listApps(filter) {
    let q = db()
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (filter?.ownerId) q = q.eq("owner_id", filter.ownerId);
    if (filter?.sellerId) q = q.eq("seller_id", filter.sellerId);
    const { data } = await q;
    return (data || []) as App[];
  },

  async getAppById(id) {
    const { data } = await db()
      .from("applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data as App | null;
  },

  async getAppByAppId(appId) {
    const { data } = await db()
      .from("applications")
      .select("*")
      .eq("app_id", appId)
      .maybeSingle();
    return data as App | null;
  },

  async getAppByName(name) {
    const { data } = await db()
      .from("applications")
      .select("*")
      .eq("name", name)
      .maybeSingle();
    return data as App | null;
  },

  async createApp(data) {
    const { data: row, error } = await db()
      .from("applications")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row as App;
  },

  async updateApp(id, data) {
    const { data: row, error } = await db()
      .from("applications")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return row as App;
  },

  async deleteApp(id) {
    await db().from("applications").delete().eq("id", id);
  },

  async getAppUser(appId, username) {
    const { data } = await db()
      .from("app_users")
      .select("*")
      .eq("app_id", appId)
      .eq("username", username)
      .maybeSingle();
    return data as AppUser | null;
  },

  async getAppUserById(id) {
    const { data } = await db()
      .from("app_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data as AppUser | null;
  },

  async createAppUser(data) {
    const { data: row, error } = await db()
      .from("app_users")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row as AppUser;
  },

  async updateAppUser(id, data) {
    const { data: row } = await db()
      .from("app_users")
      .update(data)
      .eq("id", id)
      .select()
      .maybeSingle();
    return row as AppUser | null;
  },

  async deleteAppUser(id) {
    await db().from("app_users").delete().eq("id", id);
  },

  async listAppUsers(filter) {
    let q = db()
      .from("app_users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filter?.limit || 200);
    if (filter?.appId) q = q.eq("app_id", filter.appId);
    if (filter?.banned !== undefined) q = q.eq("banned", filter.banned);
    const { data } = await q;
    return (data || []) as AppUser[];
  },

  async getLicenseByKey(appId, key) {
    const { data } = await db()
      .from("licenses")
      .select("*")
      .eq("app_id", appId)
      .eq("key", key)
      .maybeSingle();
    return data as License | null;
  },

  async getLicenseById(id) {
    const { data } = await db()
      .from("licenses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data as License | null;
  },

  async createLicenses(items) {
    const { data, error } = await db()
      .from("licenses")
      .insert(items)
      .select("*");
    if (error) throw error;
    return (data || []) as License[];
  },

  async listLicenses(filter) {
    let q = db()
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filter?.limit || 200);
    if (filter?.appId) q = q.eq("app_id", filter.appId);
    if (filter?.status) q = q.eq("status", filter.status);
    const { data } = await q;
    return (data || []) as License[];
  },

  async updateLicense(id, data) {
    const { data: row } = await db()
      .from("licenses")
      .update(data)
      .eq("id", id)
      .select()
      .maybeSingle();
    return row as License | null;
  },

  async deleteLicense(id) {
    await db().from("licenses").delete().eq("id", id);
  },

  async getSession(sessionId) {
    const { data } = await db()
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!data) return null;
    if (new Date((data as Session).expires_at) < new Date()) return null;
    if (!(data as Session).valid) return null;
    return data as Session;
  },

  async createSession(data) {
    const { data: row, error } = await db()
      .from("sessions")
      .insert({
        session_id: data.session_id,
        app_id: data.app_id,
        user_id: data.user_id,
        ip: data.ip,
        hwid: data.hwid,
        expires_at: data.expires_at,
        valid: data.valid,
      })
      .select()
      .single();
    if (error) throw error;
    return row as Session;
  },

  async updateSession(sessionId, data) {
    const { data: row } = await db()
      .from("sessions")
      .update(data)
      .eq("session_id", sessionId)
      .select()
      .maybeSingle();
    return row as Session | null;
  },

  async invalidateSession(sessionId) {
    await db()
      .from("sessions")
      .update({ valid: false })
      .eq("session_id", sessionId);
  },

  async listSessionsForApp(appId, limit = 50) {
    const { data } = await db()
      .from("sessions")
      .select("*")
      .eq("app_id", appId)
      .eq("valid", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    const now = new Date();
    return ((data || []) as Session[]).filter(
      (s) => new Date(s.expires_at) > now
    );
  },

  async listVariables(appId) {
    const { data } = await db()
      .from("variables")
      .select("*")
      .eq("app_id", appId)
      .order("name");
    return (data || []) as Variable[];
  },

  async getVariable(appId, name) {
    const { data } = await db()
      .from("variables")
      .select("*")
      .eq("app_id", appId)
      .eq("name", name)
      .maybeSingle();
    return data as Variable | null;
  },

  async upsertVariable(appId, name, value, authed) {
    const { data, error } = await db()
      .from("variables")
      .upsert(
        { app_id: appId, name, value, authed },
        { onConflict: "app_id,name" }
      )
      .select()
      .single();
    if (error) throw error;
    return data as Variable;
  },

  async deleteVariable(id) {
    await db().from("variables").delete().eq("id", id);
  },

  async createLog(data) {
    await db().from("logs").insert(data);
  },

  async listLogs(filter) {
    let q = db()
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filter?.limit || 300);
    if (filter?.appId) q = q.eq("app_id", filter.appId);
    if (filter?.level) q = q.eq("level", filter.level);
    const { data } = await q;
    return (data || []) as Log[];
  },

  async getOAuthLink(provider, providerUserId) {
    const { data } = await db()
      .from("oauth_links")
      .select("*")
      .eq("provider", provider)
      .eq("provider_user_id", providerUserId)
      .maybeSingle();
    return (data as OAuthLink) || null;
  },

  async listOAuthLinksForAdmin(adminId) {
    const { data } = await db()
      .from("oauth_links")
      .select("*")
      .eq("admin_id", adminId);
    return (data || []) as OAuthLink[];
  },

  async createOAuthLink(data) {
    const { data: row, error } = await db()
      .from("oauth_links")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return row as OAuthLink;
  },

  async deleteOAuthLink(id) {
    await db().from("oauth_links").delete().eq("id", id);
  },
};

