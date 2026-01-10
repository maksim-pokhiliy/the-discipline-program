"use client";

export const formatPublishedAt = (date: Date | null): string => {
  if (!date) {
    return "Not published";
  }

  return new Date(date).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
