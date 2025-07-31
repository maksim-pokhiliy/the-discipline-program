import { MonobankWebhook } from "@repo/api";
import { NextRequest, NextResponse } from "next/server";

import { getPaymentStorage } from "@app/lib/storage/payment-storage";

export async function POST(request: NextRequest) {
  try {
    const webhook: MonobankWebhook = await request.json();
    const storage = getPaymentStorage();

    console.log("Received Monobank webhook:", webhook);

    if (!webhook.reference) {
      console.error("Webhook without reference:", webhook);

      return NextResponse.json({ error: "No reference in webhook" }, { status: 400 });
    }

    const order = storage.findByReference(webhook.reference);

    if (!order) {
      console.error("Order not found for reference:", webhook.reference);

      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const previousStatus = order.status;

    switch (webhook.status) {
      case "success":
        order.status = "completed";
        order.completedAt = new Date().toISOString();

        console.log(`✅ Payment completed for order ${order.id}, program: ${order.programName}`);

        break;

      case "failure":
      case "expired":
        order.status = "failed";
        console.log(`❌ Payment failed for order ${order.id}: ${webhook.status}`);
        break;

      case "processing":
        order.status = "processing";
        break;

      default:
        console.log(`ℹ️ Payment status ${webhook.status} for order ${order.id}`);
    }

    order.updatedAt = new Date().toISOString();
    storage.set(webhook.reference, order);

    console.log(`Order ${order.id} status: ${previousStatus} → ${order.status}`);

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);

    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Monobank webhook endpoint is active",
    timestamp: new Date().toISOString(),
  });
}
