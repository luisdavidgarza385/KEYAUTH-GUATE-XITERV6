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
    const credits = parseInt(body?.credits) || 0;
    const action = String(body?.action || "add"); // add, set, unlimited

    if (!targetEmail) return { status: 400, data: { success: false, message: "Email required" } };

    const target = await store.getAdminByEmail(targetEmail);
    if (!target) return { status: 404, data: { success: false, message: "User not found" } };

    if (action === "unlimited") {
      const subEnd = new Date(Date.now() + 36500 * 86400000).toISOString();
      await store.updateAdmin(target.id, {
        ...target,
        subscription_end: subEnd,
        credits: 999999999,
      });
      try {
        await saveUserToFirebase(target.id, {
          email: target.email,
          credits: 999999999,
          subscriptionEnd: subEnd,
          role: target.role,
        });
        await logToFirebase(me.id, { type: "grant_unlimited", amount: 0, description: `Set ${targetEmail} as unlimited` });
      } catch {}
      return { data: { success: true, message: `${targetEmail} ahora es ilimitado` } };
    }

    if (credits <= 0) return { status: 400, data: { success: false, message: "Credits must be > 0" } };

    const current = target.credits ?? 0;
    const newCredits = action === "set" ? credits : current + credits;

    await store.updateAdmin(target.id, { ...target, credits: newCredits });

    try {
      await saveUserToFirebase(target.id, {
        email: target.email,
        credits: newCredits,
        subscriptionEnd: target.subscription_end,
        role: target.role,
      });
      await logToFirebase(me.id, { type: "send_credits", amount: credits, description: `Sent ${credits} credits to ${targetEmail}` });
    } catch {}

    return { data: { success: true, message: `${credits} creditos enviados a ${targetEmail}. Saldo: ${newCredits}` } };
  });
}
