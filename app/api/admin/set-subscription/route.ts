import { NextRequest } from "next/server";
import { requireAdmin, safeRoute } from "@/lib/api-helpers";
import { store } from "@/lib/store";
import { saveUserToFirebase, logToFirebase } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return safeRoute(async () => {
    const me = await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const targetEmail = String(body?.email || "").trim().toLowerCase();
    const days = parseInt(body?.days) || 30;

    if (!targetEmail) return { status: 400, data: { success: false, message: "Email required" } };

    const target = await store.getAdminByEmail(targetEmail);
    if (!target) return { status: 404, data: { success: false, message: "User not found" } };

    const subEnd = new Date(Date.now() + days * 86400000).toISOString();

    await store.updateAdmin(target.id, { ...target, subscription_end: subEnd });

    try {
      await saveUserToFirebase(target.id, {
        email: target.email,
        credits: target.credits ?? 0,
        subscriptionEnd: subEnd,
        role: target.role,
      });
      await logToFirebase(me.id, { type: "set_subscription", amount: days, description: `Set ${days}d subscription for ${targetEmail}` });
    } catch {}

    return { data: { success: true, message: `Suscripcion de ${days} dias asignada a ${targetEmail}` } };
  });
}
