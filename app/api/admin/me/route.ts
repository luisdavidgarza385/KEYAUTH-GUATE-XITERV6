import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await getCurrentAdmin();
    if (!me) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const fullAdmin = await store.getAdminById(me.id);
    if (!fullAdmin) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }
    const hasSub = fullAdmin.subscription_end ? new Date(fullAdmin.subscription_end).getTime() > Date.now() : false;
    return NextResponse.json({
      success: true,
      data: {
        id: fullAdmin.id,
        email: fullAdmin.email,
        role: fullAdmin.role,
        credits: fullAdmin.credits ?? 0,
        status: fullAdmin.status ?? "active",
        created_at: fullAdmin.created_at,
        hasSubscription: hasSub,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Server error" }, { status: 500 });
  }
}
