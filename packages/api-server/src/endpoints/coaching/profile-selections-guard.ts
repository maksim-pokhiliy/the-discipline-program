import { ValidationError } from "@repo/errors";

import { prisma } from "../../db/client";

export const PROFILE_SELECTIONS_FIELD = "profileSelections";

export type SelectionVerdict = "ok" | "orphan" | "stale" | "bound";

export type ProfileSelectionAxis = {
  id: string;
  label: string;
  values: readonly string[];
  binding: string | null;
};

export type SelectionEntry =
  | { key: string; value: string; verdict: "orphan" }
  | { key: string; value: string; verdict: "ok" | "stale" | "bound"; axis: ProfileSelectionAxis };

export const boundAxisRejectMessage = (axisLabel: string): string =>
  `Profile selections cannot target the "${axisLabel}" axis — it is set from a dedicated profile field`;

export const classifyProfileSelections = (
  selections: Record<string, string>,
  axes: readonly ProfileSelectionAxis[],
): SelectionEntry[] => {
  const axisById = new Map(axes.map((axis) => [axis.id, axis]));

  return Object.entries(selections).map(([key, value]): SelectionEntry => {
    const axis = axisById.get(key);

    if (axis === undefined) {
      return { key, value, verdict: "orphan" };
    }

    if (axis.binding !== null) {
      return { key, value, verdict: "bound", axis };
    }

    return { key, value, verdict: axis.values.includes(value) ? "ok" : "stale", axis };
  });
};

const assertNoBoundAxis = (entries: readonly SelectionEntry[]): void => {
  for (const entry of entries) {
    if (entry.verdict === "bound") {
      throw new ValidationError(boundAxisRejectMessage(entry.axis.label), {
        field: PROFILE_SELECTIONS_FIELD,
        axisId: entry.axis.id,
        axisLabel: entry.axis.label,
      });
    }
  }
};

const keepResolvable = (entries: readonly SelectionEntry[]): Record<string, string> =>
  Object.fromEntries(
    entries.filter((entry) => entry.verdict === "ok").map((entry) => [entry.key, entry.value]),
  );

export const assertAndPruneProfileSelections = async (
  selections: Record<string, string>,
): Promise<Record<string, string>> => {
  const keys = Object.keys(selections);

  if (keys.length === 0) {
    return {};
  }

  const axes = await prisma.profileAxis.findMany({
    where: { id: { in: keys } },
    select: { id: true, label: true, values: true, binding: true },
  });

  const entries = classifyProfileSelections(selections, axes);

  assertNoBoundAxis(entries);

  return keepResolvable(entries);
};
