import { repetitionAxisSchema } from "@repo/contracts/lms/composition";

import type { RepetitionAxis } from "../components/axes/axis-draft.types";

export const fieldErrorsFor = (axis: RepetitionAxis): Map<string, string> => {
  const result = repetitionAxisSchema.safeParse(axis);

  if (result.success) {
    return new Map();
  }

  const errors = new Map<string, string>();

  for (const issue of result.error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && !errors.has(key)) {
      errors.set(key, issue.message);
    }
  }

  return errors;
};
