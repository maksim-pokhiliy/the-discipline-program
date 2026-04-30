import { z } from "zod";

export type PlanSelectionKind = "block" | "segment" | "entry";

export type PlanSelection = {
  kind: PlanSelectionKind;
  ids: string[];
};

export type SinglePlanSelection = {
  kind: PlanSelectionKind;
  id: string;
};

export const PLAN_SELECTION_URL_CAP = 50;
export const SESSION_STORE_PREFIX = "session-store:";

const cuidSchema = z.string().cuid();

const isValidKind = (raw: string): raw is PlanSelectionKind =>
  raw === "block" || raw === "segment" || raw === "entry";

const isValidCuid = (raw: string): boolean => cuidSchema.safeParse(raw).success;

const dedupePreserveOrder = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    result.push(id);
  }

  return result;
};

const readSessionStore = (key: string): PlanSelection | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(`plan-selection:${key}`);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as { kind?: unknown; ids?: unknown };

    if (typeof candidate.kind !== "string" || !isValidKind(candidate.kind)) {
      return null;
    }

    if (!Array.isArray(candidate.ids)) {
      return null;
    }

    const ids: string[] = [];

    for (const raw of candidate.ids) {
      if (typeof raw !== "string" || !isValidCuid(raw)) {
        return null;
      }

      ids.push(raw);
    }

    if (ids.length === 0) {
      return null;
    }

    return { kind: candidate.kind, ids: dedupePreserveOrder(ids) };
  } catch {
    return null;
  }
};

const writeSessionStore = (selection: PlanSelection): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${selection.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  try {
    window.sessionStorage.setItem(
      `plan-selection:${key}`,
      JSON.stringify({ kind: selection.kind, ids: selection.ids }),
    );

    return key;
  } catch {
    return null;
  }
};

export const parsePlanSelection = (raw: string | null): PlanSelection | null => {
  if (!raw) {
    return null;
  }

  if (raw.startsWith(SESSION_STORE_PREFIX)) {
    const key = raw.slice(SESSION_STORE_PREFIX.length);

    if (!key) {
      return null;
    }

    return readSessionStore(key);
  }

  const colon = raw.indexOf(":");

  if (colon <= 0 || colon === raw.length - 1) {
    return null;
  }

  const kindRaw = raw.slice(0, colon);
  const idsRaw = raw.slice(colon + 1);

  if (!isValidKind(kindRaw)) {
    return null;
  }

  const idCandidates = idsRaw.split(",").filter((id) => id.length > 0);

  if (idCandidates.length === 0) {
    return null;
  }

  for (const id of idCandidates) {
    if (!isValidCuid(id)) {
      return null;
    }
  }

  return { kind: kindRaw, ids: dedupePreserveOrder(idCandidates) };
};

export const parseSinglePlanSelection = (raw: string | null): SinglePlanSelection | null => {
  const parsed = parsePlanSelection(raw);

  if (!parsed) {
    return null;
  }

  const first = parsed.ids[0];

  if (!first) {
    return null;
  }

  return { kind: parsed.kind, id: first };
};

export const formatPlanSelection = (selection: PlanSelection): string => {
  if (selection.ids.length === 0) {
    return "";
  }

  if (selection.ids.length > PLAN_SELECTION_URL_CAP) {
    const key = writeSessionStore(selection);

    if (key) {
      return `${SESSION_STORE_PREFIX}${key}`;
    }
  }

  return `${selection.kind}:${selection.ids.join(",")}`;
};

export const formatSinglePlanSelection = (selection: SinglePlanSelection): string =>
  `${selection.kind}:${selection.id}`;

export const planSelectionContains = (
  selection: PlanSelection | null,
  kind: PlanSelectionKind,
  id: string,
): boolean => {
  if (!selection) {
    return false;
  }

  return selection.kind === kind && selection.ids.includes(id);
};

export const togglePlanSelectionId = (
  current: PlanSelection | null,
  kind: PlanSelectionKind,
  id: string,
  additive: boolean,
): PlanSelection | null => {
  if (!additive) {
    return { kind, ids: [id] };
  }

  if (!current || current.kind !== kind) {
    return { kind, ids: [id] };
  }

  if (current.ids.includes(id)) {
    const remaining = current.ids.filter((existing) => existing !== id);

    if (remaining.length === 0) {
      return null;
    }

    return { kind, ids: remaining };
  }

  return { kind, ids: [...current.ids, id] };
};
