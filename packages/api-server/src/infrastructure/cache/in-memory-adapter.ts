import { type CachePort, type CacheSetOptions } from "./port";

type Entry = { value: unknown; expiresAt: number | null };

const store = new Map<string, Entry>();

export const createInMemoryCache = (): CachePort => ({
  get: async <T>(key: string): Promise<T | null> => {
    const entry = store.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      store.delete(key);

      return null;
    }

    return entry.value as T;
  },
  set: async <T>(key: string, value: T, options?: CacheSetOptions): Promise<void> => {
    const expiresAt =
      options?.ttlSeconds !== undefined ? Date.now() + options.ttlSeconds * 1_000 : null;

    store.set(key, { value, expiresAt });
  },
  delete: async (key: string): Promise<void> => {
    store.delete(key);
  },
});

export const inMemoryCache = createInMemoryCache();
