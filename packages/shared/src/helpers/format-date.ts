type DateFormatStyle = "short" | "medium" | "long" | "compact";

export const formatDate = (date: Date | string, style: DateFormatStyle = "short"): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (style) {
    case "short":
      return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
    case "medium":
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    case "long":
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(d);
    case "compact":
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
  }
};
