export type PublishAction = "created" | "updated" | "skipped";

export type PublishedDayState = {
  contentHash: string;
  hasContent: boolean;
};

export const decidePublishAction = (
  existing: PublishedDayState | null,
  hash: string,
): PublishAction => {
  if (existing === null) {
    return "created";
  }

  if (existing.hasContent && existing.contentHash === hash) {
    return "skipped";
  }

  return "updated";
};
