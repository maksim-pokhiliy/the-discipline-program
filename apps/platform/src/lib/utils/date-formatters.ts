export const formatShortDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatWorkoutDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const formatCreatedDate = (date: Date) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
