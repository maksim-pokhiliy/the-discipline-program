import { z } from "zod";

export type RekeyResult = { next: Record<string, string>; drops: string[]; flags: string[] };

export const GENDER_KEY_TOKENS: ReadonlySet<string> = new Set(["gender", "sex"]);

const cuidSchema = z.string().cuid();

export const normalizeAxisName = (key: string): string => key.trim().toLowerCase();

export const classifyKey = (key: string): "cuid" | "gender" | "name" => {
  if (cuidSchema.safeParse(key).success) {
    return "cuid";
  }

  if (GENDER_KEY_TOKENS.has(normalizeAxisName(key))) {
    return "gender";
  }

  return "name";
};

export const reKeyProfileSelections = (
  selections: Record<string, string>,
  hasTypedGender: boolean,
  axisIdByName: Record<string, string>,
): RekeyResult => {
  const next: Record<string, string> = {};
  const drops: string[] = [];
  const flags: string[] = [];

  for (const [key, value] of Object.entries(selections)) {
    const kind = classifyKey(key);

    if (kind === "cuid") {
      next[key] = value;
      continue;
    }

    if (kind === "gender") {
      if (hasTypedGender) {
        drops.push(key);
      } else {
        flags.push(key);
      }

      continue;
    }

    const axisId = axisIdByName[normalizeAxisName(key)];

    if (axisId === undefined) {
      flags.push(key);
      continue;
    }

    next[axisId] = value;
  }

  return { next, drops, flags };
};
