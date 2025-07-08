export interface MonobankInvoiceRequest {
  amount: number;
  ccy?: number;
  merchantPaymInfo?: {
    reference?: string;
    destination?: string;
    comment?: string;
    basketOrder?: BasketItem[];
  };
  redirectUrl?: string;
  webHookUrl?: string;
  validity?: number;
  paymentType?: "debit" | "hold";
}

export interface BasketItem {
  name: string;
  qty: number;
  sum: number;
  icon?: string;
  unit?: string;
  code?: string;
  barcode?: string;
  header?: string;
  footer?: string;
}

export interface MonobankInvoiceResponse {
  invoiceId: string;
  pageUrl: string;
}

export interface MonobankInvoiceStatus {
  invoiceId: string;
  status: "created" | "processing" | "hold" | "success" | "failure" | "reversed" | "expired";
  failureReason?: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate: string;
  modifiedDate?: string;
  reference?: string;
  cancelList?: CancelInfo[];
  destination?: string;
  comment?: string;
}

export interface CancelInfo {
  status: "processing" | "success" | "failure";
  amount: number;
  ccy: number;
  createdDate: string;
  modifiedDate?: string;
  approvalCode?: string;
  rrn?: string;
  extRef?: string;
}

export interface PaymentOrder {
  id: string;
  programId: string;
  programName: string;
  amount: number;
  currency: "USD" | "EUR" | "UAH";
  customerEmail: string;
  customerName?: string;
  status: "pending" | "processing" | "completed" | "failed" | "expired";
  monoInvoiceId?: string;
  monoPageUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreatePaymentRequest {
  programId: string;
  customerEmail: string;
  customerName?: string;
  redirectUrl?: string;
}

export interface CreatePaymentResponse {
  orderId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
}

export interface MonobankWebhook {
  invoiceId: string;
  status: MonobankInvoiceStatus["status"];
  reference?: string;
  amount: number;
  ccy: number;
  createdDate: string;
  modifiedDate?: string;
}
