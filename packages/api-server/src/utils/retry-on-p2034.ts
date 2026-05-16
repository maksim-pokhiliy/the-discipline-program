import { Prisma } from "@prisma/client";

import { ServiceUnavailableError } from "@repo/errors";

export type RetryOnP2034Options = {
  attempts?: number;
  jitterMsRange?: readonly [number, number];
  retryAfterSeconds?: number;
};

const DEFAULTS = {
  attempts: 2,
  jitterMsRange: [50, 200] as const,
  retryAfterSeconds: 5,
};

const isP2034 = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const jitter = (range: readonly [number, number]) =>
  range[0] + Math.random() * (range[1] - range[0]);

export const retryOnP2034 = async <T>(
  fn: () => Promise<T>,
  options?: RetryOnP2034Options,
): Promise<T> => {
  const attempts = options?.attempts ?? DEFAULTS.attempts;
  const range = options?.jitterMsRange ?? DEFAULTS.jitterMsRange;
  const retryAfterSeconds = options?.retryAfterSeconds ?? DEFAULTS.retryAfterSeconds;

  if (attempts < 1) {
    throw new Error("retryOnP2034: attempts must be >= 1");
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isP2034(error)) {
        throw error;
      }

      if (attempt < attempts - 1) {
        await sleep(jitter(range));
      }
    }
  }

  throw new ServiceUnavailableError(
    "Resource is being modified concurrently, please retry in a moment",
    { retryAfter: retryAfterSeconds, lastErrorCode: "P2034" },
  );
};
