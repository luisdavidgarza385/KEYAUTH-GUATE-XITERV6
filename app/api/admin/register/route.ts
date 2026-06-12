import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store } from "@/lib/store";
import { signSessionValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const json = (data: unknown, status = 200) =>
    NextResponse.json(data, { status });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, message: "Invalid JSON" }, 400);
    }

    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) {
      return json({ success: false, message: "email and password required" }, 400);
    }
    if (password.length < 8) {
      return json({ success: false, message: "Password must be at least 8 characters" }, 400);
    }
    if (email.length < 3) {
      return json({ success: false, message: "Username or email must be at least 3 characters" }, 400);
    }

    const existing = await store.getAdminByEmail(email);
    if (existing) {
      return json({ success: false, message: "Email already registered" }, 409);
    }

    const allAdmins = await store.listAdmins();
    const role = allAdmins.length === 0 ? "developer" : "admin";

    const hash = await bcrypt.hash(password, 10);
    const admin = await store.createAdmin({ email, password_hash: hash, role, credits: 1000 });

    const cookieValue = signSessionValue({ id: admin.id, email: admin.email, role: admin.role as "admin" | "seller" | "developer" });

    const res = json({ success: true, data: { id: admin.id, email: admin.email, role: admin.role } });
    res.cookies.set("ka_admin_session", cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return json({ success: false, message: "Server error" }, 500);
  }
}
