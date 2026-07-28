import { formatDate } from "@repo/shared";

export const formatPublishDate = (value: Date): string => {
  const publishedAt = new Date(value);
  const isCurrentYear = publishedAt.getFullYear() === new Date().getFullYear();

  return isCurrentYear ? formatDate(publishedAt, "day") : formatDate(publishedAt, "short");
};
