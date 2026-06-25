export type PublishAction = "created" | "updated" | "skipped" | "conflict";

export type PublishWrite = "POST" | "PUT" | "none";

export type DecidePublishActionInput = {
  isOwned: boolean;
  hasLegacyRow: boolean;
  contentMatches: boolean;
  overwriteUnowned: boolean;
};

export type PublishDecision = {
  action: PublishAction;
  write: PublishWrite;
};

export const decidePublishAction = (input: DecidePublishActionInput): PublishDecision => {
  const { isOwned, hasLegacyRow, contentMatches, overwriteUnowned } = input;

  if (!hasLegacyRow) {
    return { action: "created", write: "POST" };
  }

  if (contentMatches) {
    return { action: "skipped", write: "none" };
  }

  if (!isOwned && !overwriteUnowned) {
    return { action: "conflict", write: "none" };
  }

  return { action: "updated", write: "PUT" };
};
