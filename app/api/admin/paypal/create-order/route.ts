import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, description } = body;

    if (!amount || !description) {
      return Response.json({ success: false, message: "amount and description required" }, { status: 400 });
    }

    const { createOrder } = await import("@/lib/paypal");
    const order = await createOrder(amount, description);

    if (order?.id) {
      return Response.json({ success: true, orderId: order.id });
    }

    return Response.json({ success: false, message: order?.message || "Failed to create order" }, { status: 500 });
  } catch (e: any) {
    return Response.json({ success: false, message: e.message }, { status: 500 });
  }
}
