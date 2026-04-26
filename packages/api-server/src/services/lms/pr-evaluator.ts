import type { PrismaClient } from "@prisma/client";

export interface EvaluatePrInput {
  db: PrismaClient;
  setLogId: string;
}

export interface EvaluatePrResult {
  newPrIds: string[];
}

export async function evaluatePr(_input: EvaluatePrInput): Promise<EvaluatePrResult> {
  throw new Error(
    "pr-evaluator: not implemented in M0 — see ADR-0028 and docs/design/workout-redesign.md §6.3",
  );
}
