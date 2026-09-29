import { findHeadCoachHolders, type HeadCoachHolder } from "./head-coach-slot";
import { cleanupRaw } from "./helpers";
import { takeTableCensus, type TableCensus } from "./table-census";

const BASELINE_LOCK_TIMEOUT = "5s";
const BASELINE_TRANSACTION_TIMEOUT_MS = 15_000;

export type FileBaseline = { census: TableCensus; headCoachHolders: HeadCoachHolder[] };

export const takeFileBaseline = (): Promise<FileBaseline> =>
  cleanupRaw.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '${BASELINE_LOCK_TIMEOUT}'`);

      return {
        census: await takeTableCensus(tx),
        headCoachHolders: await findHeadCoachHolders(tx),
      };
    },
    { timeout: BASELINE_TRANSACTION_TIMEOUT_MS },
  );
