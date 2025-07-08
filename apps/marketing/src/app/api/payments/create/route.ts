import {
  createMonobankService,
  CreatePaymentRequest,
  PaymentOrder,
  Program,
  programsApi,
} from "@repo/api";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { getPaymentStorage } from "@app/lib/storage/payment-storage";

const MONOBANK_TOKEN = process.env.MONOBANK_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_API_URL || "https://the-discipline-program.vercel.app";

if (!MONOBANK_TOKEN) {
  console.warn("MONOBANK_TOKEN is not set - payments will not work");
}

export async function POST(request: NextRequest) {
  try {
    if (!MONOBANK_TOKEN) {
      return NextResponse.json({ error: "Payment system is not configured" }, { status: 503 });
    }

    const body: CreatePaymentRequest = await request.json();
    const storage = getPaymentStorage();

    if (!body.programId || !body.customerEmail) {
      return NextResponse.json(
        { error: "programId and customerEmail are required" },
        { status: 400 },
      );
    }

    const programs = await programsApi.getPrograms();
    const program = programs.find((p: Program) => p.id === body.programId && p.isActive);

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const orderId = uuidv4();

    const order: PaymentOrder = {
      id: orderId,
      programId: program.id,
      programName: program.name,
      amount: program.price,
      currency: "USD",
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.set(orderId, order);

    const monoService = createMonobankService(MONOBANK_TOKEN);
    const webhookUrl = `${APP_URL}/api/payments/webhook`;
    const redirectUrl = body.redirectUrl || `${APP_URL}/payment/success?orderId=${orderId}`;

    const monoResponse = await monoService.createProgramPayment(
      program,
      order,
      webhookUrl,
      redirectUrl,
    );

    order.monoInvoiceId = monoResponse.invoiceId;
    order.monoPageUrl = monoResponse.pageUrl;
    order.status = "processing";
    order.updatedAt = new Date().toISOString();
    storage.set(orderId, order);

    return NextResponse.json({
      orderId: order.id,
      paymentUrl: monoResponse.pageUrl,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Payment creation error:", error);

    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const storage = getPaymentStorage();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = storage.get(orderId);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
