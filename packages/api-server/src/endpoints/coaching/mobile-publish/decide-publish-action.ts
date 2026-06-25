import { type MobilePublishedDay } from "@prisma/client";

import { type LegacyGeneralProgram } from "../../../infrastructure/legacy-mobile";

export type PublishAction = "created" | "updated" | "skipped" | "conflict";

export type PublishWrite = "POST" | "PUT" | "none";

export type DecidePublishActionInput = {
  existingRecord: Pick<MobilePublishedDay, "contentHash"> | null;
  legacyRow: LegacyGeneralProgram | null;
  hash: string;
  overwriteUnowned: boolean;
};

export type PublishDecision = {
  action: PublishAction;
  write: PublishWrite;
};

export const decidePublishAction = (input: DecidePublishActionInput): PublishDecision => {
  const { existingRecord, legacyRow, hash, overwriteUnowned } = input;

  if (existingRecord === null) {
    if (legacyRow === null) {
      return { action: "created", write: "POST" };
    }

    if (!overwriteUnowned) {
      return { action: "conflict", write: "none" };
    }

    return { action: "updated", write: "PUT" };
  }

  if (legacyRow === null) {
    return { action: "created", write: "POST" };
  }

  if (hash === existingRecord.contentHash) {
    return { action: "skipped", write: "none" };
  }

  return { action: "updated", write: "PUT" };
};
