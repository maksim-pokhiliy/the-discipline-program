/* eslint-disable no-var */
import { PaymentOrder } from "@repo/api";

class PaymentStorage {
  private orders = new Map<string, PaymentOrder>();

  constructor() {
    this.seedTestData();
  }

  private seedTestData() {
    const testOrder: PaymentOrder = {
      id: "a73e9f1b-a7e4-4a2c-bad7-b88d6d51d6c3",
      programId: "advanced",
      programName: "Advanced",
      amount: 19.99,
      currency: "USD",
      customerEmail: "test@example.com",
      customerName: "Test User",
      status: "completed",
      monoInvoiceId: "test_invoice_123",
      monoPageUrl: "https://pay.monobank.ua/test",
      createdAt: "2025-06-04T14:00:00Z",
      updatedAt: "2025-06-04T14:05:00Z",
      completedAt: "2025-06-04T14:05:00Z",
    };

    this.orders.set(testOrder.id, testOrder);
  }

  set(orderId: string, order: PaymentOrder): void {
    this.orders.set(orderId, order);
  }

  get(orderId: string): PaymentOrder | undefined {
    return this.orders.get(orderId);
  }

  findByReference(reference: string): PaymentOrder | null {
    for (const [orderId, order] of this.orders.entries()) {
      if (orderId === reference) {
        return order;
      }
    }

    return null;
  }

  entries(): IterableIterator<[string, PaymentOrder]> {
    return this.orders.entries();
  }

  getAll(): PaymentOrder[] {
    return Array.from(this.orders.values());
  }

  size(): number {
    return this.orders.size;
  }
}

declare global {
  var __paymentStorage: PaymentStorage | undefined;
}

export const getPaymentStorage = (): PaymentStorage => {
  if (!global.__paymentStorage) {
    global.__paymentStorage = new PaymentStorage();
  }

  return global.__paymentStorage;
};
