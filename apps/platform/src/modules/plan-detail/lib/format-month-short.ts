const FORMATTER_LOCALE = "en-US";

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat(FORMATTER_LOCALE, { month: "short" });

export const formatMonthShort = (date: Date): string => MONTH_SHORT_FORMATTER.format(date);
