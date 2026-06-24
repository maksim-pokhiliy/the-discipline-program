import { z } from "zod";

import { PROFILE_AXIS_BINDINGS, PROFILE_AXIS_CONSTANTS } from "./profile-axis.constants";

const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g;

const normalizeText = (raw: string): string => raw.normalize("NFKC").replace(ZERO_WIDTH_RE, "");

const normalizedString = (max: number) =>
  z.string().transform(normalizeText).pipe(z.string().trim().min(1).max(max));

export const PROFILE_AXIS_VALUES_UNIQUE_MESSAGE = "Profile axis values must be unique";

export const profileAxisBindingSchema = z.enum(PROFILE_AXIS_BINDINGS);

const assertValuesUnique = (
  data: { values?: readonly string[] | undefined },
  ctx: z.RefinementCtx,
): void => {
  if (data.values === undefined) {
    return;
  }

  const seen = new Set<string>();

  data.values.forEach((value, index) => {
    if (seen.has(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["values", index],
        message: PROFILE_AXIS_VALUES_UNIQUE_MESSAGE,
      });
    }

    seen.add(value);
  });
};

export const profileAxisSchema = z.object({
  id: z.string().cuid(),
  key: z.string().min(1).max(PROFILE_AXIS_CONSTANTS.MAX_KEY_LENGTH),
  label: z.string().min(1).max(PROFILE_AXIS_CONSTANTS.MAX_LABEL_LENGTH),
  values: z.array(z.string().min(1)).min(1),
  binding: profileAxisBindingSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const profileAxisFormBase = z.object({
  key: normalizedString(PROFILE_AXIS_CONSTANTS.MAX_KEY_LENGTH),
  label: normalizedString(PROFILE_AXIS_CONSTANTS.MAX_LABEL_LENGTH),
  values: z
    .array(normalizedString(PROFILE_AXIS_CONSTANTS.MAX_VALUE_LENGTH))
    .min(1)
    .max(PROFILE_AXIS_CONSTANTS.MAX_VALUES),
});

export const createProfileAxisSchema = profileAxisFormBase.superRefine(assertValuesUnique);

export const updateProfileAxisSchema = profileAxisFormBase
  .partial()
  .superRefine(assertValuesUnique);
