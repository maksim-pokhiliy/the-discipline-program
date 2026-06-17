import type { FieldErrors } from "react-hook-form";

import type { RestSpec, TimeCap } from "@repo/contracts/lms/_shared";
import { timeCapSchema } from "@repo/contracts/lms/_shared";

import { restSpecFormSchema, type RestSpecFormValue } from "../components/rest-spec-fields";

const ISSUE_TYPE = "contract";

export const DEFAULT_REST: RestSpec = {
  duration: { value: 90, unit: "sec" },
  scope: "between_sets",
};

type RestDurationErrors = NonNullable<FieldErrors<RestSpecFormValue>["duration"]>;

export const restErrorsFromParse = (rest: RestSpec): FieldErrors<RestSpecFormValue> | undefined => {
  const result = restSpecFormSchema.safeParse(rest);

  if (result.success) {
    return undefined;
  }

  const duration: RestDurationErrors = {};

  for (const issue of result.error.issues) {
    const [head, field] = issue.path;

    if (head !== "duration") {
      continue;
    }

    if (field === "value" && duration.value === undefined) {
      duration.value = { type: ISSUE_TYPE, message: issue.message };
    } else if (field === "rangeMax" && duration.rangeMax === undefined) {
      duration.rangeMax = { type: ISSUE_TYPE, message: issue.message };
    } else if (field === undefined && duration.root === undefined) {
      duration.root = { type: ISSUE_TYPE, message: issue.message };
    }
  }

  return { duration };
};

export const capErrorsFromParse = (cap: TimeCap): FieldErrors<TimeCap> | undefined => {
  const result = timeCapSchema.safeParse(cap);

  if (result.success) {
    return undefined;
  }

  const errors: FieldErrors<TimeCap> = {};

  for (const issue of result.error.issues) {
    const [head] = issue.path;

    if (head === "min" && errors.min === undefined) {
      errors.min = { type: ISSUE_TYPE, message: issue.message };
    } else if ((head === "max" || head === undefined) && errors.max === undefined) {
      errors.max = { type: ISSUE_TYPE, message: issue.message };
    }
  }

  return errors;
};
