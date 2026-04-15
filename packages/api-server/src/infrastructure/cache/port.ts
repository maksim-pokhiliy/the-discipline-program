export type CacheSetOptions = {
  ttlSeconds?: number;
};

export type CachePort = {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
};
