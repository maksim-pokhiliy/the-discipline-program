import { OneRMRecordSource as PrismaOneRMRecordSource } from "@prisma/client";

import { OneRMRecordSource } from "@repo/contracts/lms";

export const ONE_RM_RECORD_SOURCE_MAP: Record<PrismaOneRMRecordSource, OneRMRecordSource> = {
  MANUAL: OneRMRecordSource.MANUAL,
  AUTO_INFERRED: OneRMRecordSource.AUTO_INFERRED,
  TESTED: OneRMRecordSource.TESTED,
};

export const ONE_RM_RECORD_SOURCE_TO_PRISMA_MAP: Record<
  OneRMRecordSource,
  PrismaOneRMRecordSource
> = {
  [OneRMRecordSource.MANUAL]: PrismaOneRMRecordSource.MANUAL,
  [OneRMRecordSource.AUTO_INFERRED]: PrismaOneRMRecordSource.AUTO_INFERRED,
  [OneRMRecordSource.TESTED]: PrismaOneRMRecordSource.TESTED,
};
