export type PlanSelectionKind = "block" | "segment" | "entry";

export type PlanSelection = {
  kind: PlanSelectionKind;
  id: string;
};

export const parsePlanSelection = (raw: string | null): PlanSelection | null => {
  if (!raw) {
    return null;
  }

  const [kindRaw, id] = raw.split(":");

  if (!id) {
    return null;
  }

  if (kindRaw === "block" || kindRaw === "segment" || kindRaw === "entry") {
    return { kind: kindRaw, id };
  }

  return null;
};

export const formatPlanSelection = (selection: PlanSelection): string =>
  `${selection.kind}:${selection.id}`;
