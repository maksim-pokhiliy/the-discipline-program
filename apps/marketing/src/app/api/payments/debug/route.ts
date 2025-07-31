import { NextResponse } from "next/server";

import { getPaymentStorage } from "@app/lib/storage/payment-storage";

export async function GET() {
  const storage = getPaymentStorage();

  return NextResponse.json({
    totalOrders: storage.size(),
    orders: storage.getAll(),
  });
}
