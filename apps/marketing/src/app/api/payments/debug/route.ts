import { NextResponse } from "next/server";

import { getPaymentStorage } from "@app/lib/storage";

export async function GET() {
  const storage = getPaymentStorage();

  return NextResponse.json({
    totalOrders: storage.size(),
    orders: storage.getAll(),
  });
}
