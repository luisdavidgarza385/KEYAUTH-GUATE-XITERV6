import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store } from "@/lib/store";
import { saveUserToFirebase } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const existing = await store.getAdminByEmail("admcreditos");
    if (existing) {
      return NextResponse.json({ success: true, message: "admcreditos already exists", id: existing.id });
    }

    const hash = await bcrypt.hash("guate xiter", 10);
    const admin = await store.createAdmin({
      email: "admcreditos",
      password_hash: hash,
      role: "developer",
      credits: 999999999,
      status: "active",
    });

    // Set subscription 10 years from now
    const subEnd = new Date(Date.now() + 3650 * 86400000).toISOString();
    await store.updateAdmin(admin.id, {
      ...admin,
      credits: 999999999,
      subscription_end: subEnd,
    });

    // Sync to Firebase
    try {
      await saveUserToFirebase(admin.id, {
        email: "admcreditos",
        credits: 999999999,
        subscriptionEnd: subEnd,
        role: "developer",
      });
    } catch {}

    return NextResponse.json({ success: true, message: "admcreditos created", id: admin.id });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
