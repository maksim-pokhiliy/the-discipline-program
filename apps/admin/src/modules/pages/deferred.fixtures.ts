import { type AdminPageDetails } from "@repo/contracts/cms/pages";

type Deferred<TValue extends void | AdminPageDetails> = {
  promise: Promise<TValue>;
  resolve: (value: TValue) => void;
  reject: (error: Error) => void;
};

export const makeDeferred = <TValue extends void | AdminPageDetails>(): Deferred<TValue> => {
  let resolve: Deferred<TValue>["resolve"] = () => {
    throw new Error("Deferred promise was not initialized");
  };
  let reject: Deferred<TValue>["reject"] = () => {
    throw new Error("Deferred promise was not initialized");
  };
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};
