import { BadRequestError } from "@repo/errors";
import { getMonday, parseDateParam } from "@repo/shared";

export const parseStartDate = (param: string): Date => {
  const parsed = parseDateParam(param);

  if (parsed === null) {
    throw new BadRequestError("startDate must be a valid YYYY-MM-DD date", {
      field: "startDate",
    });
  }

  return parsed;
};

export const resolveWeekStartDate = (startDateParam: string): Date => {
  const monday = getMonday(parseStartDate(startDateParam));

  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
};
