import {
  MonobankInvoiceRequest,
  MonobankInvoiceResponse,
  MonobankInvoiceStatus,
  PaymentOrder,
  Program,
} from "../types";

export class MonobankService {
  private baseUrl = "https://api.monobank.ua";
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async createInvoice(request: MonobankInvoiceRequest): Promise<MonobankInvoiceResponse> {
    const response = await fetch(`${this.baseUrl}/api/merchant/invoice/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": this.token,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Monobank API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getInvoiceStatus(invoiceId: string): Promise<MonobankInvoiceStatus> {
    const response = await fetch(
      `${this.baseUrl}/api/merchant/invoice/status?invoiceId=${invoiceId}`,
      {
        method: "GET",
        headers: {
          "X-Token": this.token,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Monobank API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private convertUsdToKopecks(usdAmount: number): number {
    const USD_TO_UAH_RATE = 41;
    const uahAmount = usdAmount * USD_TO_UAH_RATE;

    return Math.round(uahAmount * 100);
  }

  async createProgramPayment(
    program: Program,
    order: PaymentOrder,
    webhookUrl: string,
    redirectUrl: string,
  ): Promise<MonobankInvoiceResponse> {
    const amountInKopecks = this.convertUsdToKopecks(program.price);

    const request: MonobankInvoiceRequest = {
      amount: amountInKopecks,
      ccy: 980,
      merchantPaymInfo: {
        reference: order.id,
        destination: `Payment for ${program.name} program`,
        comment: `Online fitness program: ${program.name}`,
        basketOrder: [
          {
            name: program.name,
            qty: 1,
            sum: amountInKopecks,
            code: program.id,
            unit: "программа",
          },
        ],
      },
      redirectUrl,
      webHookUrl: webhookUrl,
      validity: 24 * 60 * 60,
      paymentType: "debit",
    };

    return this.createInvoice(request);
  }
}

export const createMonobankService = (token?: string): MonobankService => {
  if (!token) {
    throw new Error("Monobank token is required");
  }
  return new MonobankService(token);
};
