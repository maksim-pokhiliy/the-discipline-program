import {
  type PersonalRecord as PrismaPersonalRecord,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

export interface EvaluatePrInput {
  db: PrismaClient | Prisma.TransactionClient;
  setLogId: string;
}

export interface EvaluatePrResult {
  created: PrismaPersonalRecord[];
}

export const evaluatePr = async (_input: EvaluatePrInput): Promise<EvaluatePrResult> => ({
  created: [],
});
