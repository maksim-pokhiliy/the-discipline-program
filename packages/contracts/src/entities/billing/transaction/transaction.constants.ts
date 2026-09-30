export enum TransactionKind {
  INITIAL = "INITIAL",
  RENEWAL = "RENEWAL",
  ONE_OFF = "ONE_OFF",
  REFUND = "REFUND",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}
