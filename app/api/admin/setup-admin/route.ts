import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await requireAdmin();
    const subEnd = new Date(Date.now() + 36500 * 86400000).toISOString();
    await store.updateAdmin(me.id, {
      credits: 999999999,
      subscription_end: subEnd,
    });
    return NextResponse.json({ success: true, message: "Admin actualizado con créditos y suscripción ilimitada" });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
