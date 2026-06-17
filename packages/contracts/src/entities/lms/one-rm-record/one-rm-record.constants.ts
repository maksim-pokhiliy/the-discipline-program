export enum OneRMRecordSource {
  MANUAL = "MANUAL",
  AUTO_INFERRED = "AUTO_INFERRED",
  TESTED = "TESTED",
}

export const ONE_RM_RECORD_SOURCE_LABELS: Record<OneRMRecordSource, string> = {
  [OneRMRecordSource.MANUAL]: "Manual",
  [OneRMRecordSource.AUTO_INFERRED]: "Auto-inferred",
  [OneRMRecordSource.TESTED]: "Tested",
};
