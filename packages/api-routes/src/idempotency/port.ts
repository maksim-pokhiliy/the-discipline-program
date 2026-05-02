export type CachedResponse = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  createdAt: Date;
};

export type IdempotencyLookupResult =
  | { kind: "miss" }
  | { kind: "replay"; cached: CachedResponse }
  | { kind: "mismatch" };

export type IdempotencyPersistResult =
  | { status: "persisted" }
  | { status: "raced"; cached: CachedResponse };

export type IdempotencyStorePort = {
  lookup(args: {
    key: string;
    scope: string;
    route: string;
    requestFingerprint: string;
  }): Promise<IdempotencyLookupResult>;
  persist(args: {
    key: string;
    scope: string;
    route: string;
    method: string;
    requestFingerprint: string;
    response: CachedResponse;
    ttlSeconds: number;
  }): Promise<IdempotencyPersistResult>;
};
