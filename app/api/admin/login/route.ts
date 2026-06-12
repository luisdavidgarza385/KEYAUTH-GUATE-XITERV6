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

    const email: string = String(body?.email || "").trim().toLowerCase();
    const password: string = String(body?.password || "");
    if (!email || !password) {
      return json({ success: false, message: "email and password required" }, 400);
    }

    let admin = await store.getAdminByEmail(email);

    if (!admin) {
      const be = process.env.ADMIN_BOOTSTRAP_EMAIL;
      const bp = process.env.ADMIN_BOOTSTRAP_PASSWORD;
      if (be && bp && email === be.toLowerCase() && password === bp) {
        const hash = await bcrypt.hash(password, 10);
        admin = await store.createAdmin({ email, password_hash: hash, role: "admin" });
      } else {
        return json({ success: false, message: "Invalid credentials" }, 401);
      }
    }

    // Auto-assign credits and subscription for bootstrap admin
    if (email === process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase()) {
      const subEnd = new Date(Date.now() + 36500 * 86400000).toISOString();
      await store.updateAdmin(admin.id, {
        credits: 999999999,
        subscription_end: subEnd,
      });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return json({ success: false, message: "Invalid credentials" }, 401);
    }

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
