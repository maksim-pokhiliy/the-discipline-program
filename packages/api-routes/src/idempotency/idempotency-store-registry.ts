import type { IdempotencyStorePort } from "./port";

let store: IdempotencyStorePort | undefined;

export const setIdempotencyStore = (port: IdempotencyStorePort): void => {
  store = port;
};

export const getIdempotencyStore = (): IdempotencyStorePort | undefined => store;
