import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const email = "admin@example.com";
    const password = "changeme123";

    let admin = await store.getAdminByEmail(email);

    if (!admin) {
      const hash = await bcrypt.hash(password, 10);
      admin = await store.createAdmin({
        email,
        password_hash: hash,
        role: "admin",
        credits: 999999999,
        status: "active",
      });
    }

    const subEnd = new Date(Date.now() + 36500 * 86400000).toISOString();
    await store.updateAdmin(admin.id, {
      credits: 999999999,
      subscription_end: subEnd,
    });

    return NextResponse.json({
      success: true,
      message: "Admin listo. Login con admin@example.com / changeme123",
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
