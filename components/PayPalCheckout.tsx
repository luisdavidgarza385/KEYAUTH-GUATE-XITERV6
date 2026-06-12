"use client";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

interface Props {
  pkgId: string;
  amount: string;
  description: string;
  onSuccess: (data: any) => void;
  onError: (err: string) => void;
}

export function PayPalCheckout({ pkgId, amount, description, onSuccess, onError }: Props) {
  if (!CLIENT_ID) {
    return (
      <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
        PayPal no configurado (falta Client ID)
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId: CLIENT_ID, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", label: "pay" }}
        createOrder={async () => {
          const res = await fetch("/api/admin/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, description }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message);
          return data.orderId;
        }}
        onApprove={async (data) => {
          const res = await fetch("/api/admin/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID, pkg: pkgId }),
          });
          const result = await res.json();
          if (result.success) {
            onSuccess(result);
          } else {
            onError(result.message);
          }
        }}
        onError={(err) => onError(String(err))}
      />
    </PayPalScriptProvider>
  );
}
