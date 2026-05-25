import { DEFAULT_LOCALE } from "@repo/shared";

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: "short" });

export const formatMonthShort = (date: Date): string => MONTH_SHORT_FORMATTER.format(date);
