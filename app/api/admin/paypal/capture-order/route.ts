import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
export const dynamic = "force-dynamic";

const PACKAGES: Record<string, { subDays: number; label: string }> = {
  monthly: { subDays: 30, label: "Mensual" },
  yearly: { subDays: 365, label: "Anual" },
};

export async function POST(req: NextRequest) {
  try {
    const me = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const { orderId, pkg } = body;

    if (!orderId || !pkg || !PACKAGES[pkg]) {
      return Response.json({ success: false, message: "orderId and valid package required" }, { status: 400 });
    }

    const { captureOrder } = await import("@/lib/paypal");
    const capture = await captureOrder(orderId);

    if (capture?.status !== "COMPLETED") {
      return Response.json({ success: false, message: "Payment not completed" }, { status: 400 });
    }

    const pkgData = PACKAGES[pkg];
    const fullAdmin = await store.getAdminById(me.id);

    const existingEnd = fullAdmin?.subscription_end
      ? new Date(fullAdmin.subscription_end).getTime()
      : Date.now();

    const newEnd = new Date(
      Math.max(existingEnd, Date.now()) + pkgData.subDays * 86400000
    ).toISOString();

    // Subscription = unlimited access: no coin cost, no user/license limits, custom prefix
    await store.updateAdmin(me.id, {
      ...fullAdmin,
      subscription_end: newEnd,
    });

    // Log to Firebase
    try {
      const { saveUserToFirebase, logToFirebase } = await import("@/lib/firebase-admin");
      await saveUserToFirebase(me.id, {
        email: me.email,
        credits: fullAdmin?.credits ?? 0,
        subscriptionEnd: newEnd,
        role: me.role,
      });
      await logToFirebase(me.id, {
        type: "paypal_subscription",
        amount: 0,
        description: `PayPal: ${pkgData.label} - ${pkgData.subDays}d suscripción ilimitada`,
      });
    } catch {}

    return Response.json({
      success: true,
      message: `Suscripción ${pkgData.label} activada! ${pkgData.subDays}d de acceso ilimitado.`,
      subscriptionEnd: newEnd,
    });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
