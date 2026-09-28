import { type Period, PeriodUnit } from "./period";

const INTL_UNITS: Record<PeriodUnit, string> = {
  [PeriodUnit.DAY]: "day",
  [PeriodUnit.WEEK]: "week",
  [PeriodUnit.MONTH]: "month",
  [PeriodUnit.YEAR]: "year",
};

const SINGLE_PERIOD_COUNT = 1;

export const formatPeriod = (period: Period, locale: string): string => {
  const formatter = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: INTL_UNITS[period.periodUnit],
    unitDisplay: "long",
  });

  if (period.periodCount !== SINGLE_PERIOD_COUNT) {
    return formatter.format(period.periodCount);
  }

  const unitPart = formatter.formatToParts(period.periodCount).find((part) => part.type === "unit");

  return unitPart?.value ?? formatter.format(period.periodCount);
};
