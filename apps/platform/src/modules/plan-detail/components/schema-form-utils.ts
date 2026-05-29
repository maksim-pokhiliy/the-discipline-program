import type { FieldError, FieldErrors, FieldErrorsImpl, GlobalError, Merge } from "react-hook-form";
import type { z } from "zod";

import type {
  EffortPercent,
  HrZoneIntensity,
  Intensity,
  NumericPaceIntensity,
  PaceValue,
  RpeIntensity,
} from "@repo/contracts/lms/_shared";
import {
  type ArchetypeName,
  type ArchetypeParams,
  archetypeParamsSchema,
} from "@repo/contracts/lms/schema";

const PARAMS_PATH_SEGMENT = "params";

export type ShellIntensityForm = {
  effortPercent?: EffortPercent | undefined;
  rpe?: RpeIntensity | undefined;
  pace?: PaceValue | undefined;
  hrZone?: HrZoneIntensity | undefined;
  numericPace?: NumericPaceIntensity | undefined;
};

export const buildIntensityCandidate = (form: ShellIntensityForm): Intensity => ({
  ...(form.effortPercent !== undefined && { effortPercent: form.effortPercent }),
  ...(form.rpe !== undefined && { rpe: form.rpe }),
  ...(form.pace !== undefined && { pace: form.pace }),
  ...(form.hrZone !== undefined && { hrZone: form.hrZone }),
  ...(form.numericPace !== undefined && { numericPace: form.numericPace }),
});

type FieldErrorLeaf = { type: string; message: string };

interface FieldErrorTree {
  [key: string]: FieldErrorLeaf | FieldErrorTree;
}

const ROOT_KEY = "root";

const isLeaf = (node: FieldErrorLeaf | FieldErrorTree): node is FieldErrorLeaf =>
  typeof node.message === "string" && typeof node.type === "string";

const isNodeLevelIssue = (issue: z.ZodIssue): boolean => {
  if (issue.code === "custom" || issue.code === "invalid_union") {
    return true;
  }

  if (issue.code === "invalid_union_discriminator") {
    return true;
  }

  return "type" in issue && issue.type === "array";
};

const descendInto = (cursor: FieldErrorTree, key: string): FieldErrorTree => {
  const existing = cursor[key];

  if (existing !== undefined && !isLeaf(existing)) {
    return existing;
  }

  const next: FieldErrorTree = {};

  cursor[key] = next;

  return next;
};

const setRoot = (node: FieldErrorTree, leaf: FieldErrorLeaf): void => {
  if (node[ROOT_KEY] === undefined) {
    node[ROOT_KEY] = leaf;
  }
};

const assignIssue = (
  target: FieldErrorTree,
  segments: (string | number)[],
  issue: z.ZodIssue,
): void => {
  const leaf: FieldErrorLeaf = { type: String(issue.code), message: issue.message };

  let cursor = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    cursor = descendInto(cursor, String(segments[index]));
  }

  const lastSegment = segments[segments.length - 1];

  if (lastSegment === undefined) {
    setRoot(cursor, leaf);

    return;
  }

  const lastKey = String(lastSegment);

  if (isNodeLevelIssue(issue)) {
    const node = cursor[lastKey];

    if (node !== undefined && !isLeaf(node)) {
      setRoot(node, leaf);
    } else if (node === undefined) {
      cursor[lastKey] = { [ROOT_KEY]: leaf };
    }

    return;
  }

  if (cursor[lastKey] === undefined) {
    cursor[lastKey] = leaf;
  }
};

type FieldErrorValue = FieldError | Merge<FieldError, FieldErrorsImpl>;

const toFieldErrorValue = (node: FieldErrorLeaf | FieldErrorTree): FieldErrorValue => {
  if (isLeaf(node)) {
    return { type: node.type, message: node.message };
  }

  const out: Record<string, FieldErrorValue> = {};

  for (const key of Object.keys(node)) {
    const child = node[key];

    if (child !== undefined) {
      out[key] = toFieldErrorValue(child);
    }
  }

  return out;
};

const toRootError = (node: FieldErrorLeaf | FieldErrorTree): GlobalError => {
  if (isLeaf(node)) {
    return { type: node.type, message: node.message };
  }

  return {};
};

const mapZodIssuesToFieldErrors = (issues: z.ZodIssue[]): FieldErrors => {
  const tree: FieldErrorTree = {};

  for (const issue of issues) {
    const relative = issue.path[0] === PARAMS_PATH_SEGMENT ? issue.path.slice(1) : [...issue.path];

    assignIssue(tree, relative, issue);
  }

  const errors: FieldErrors = {};

  for (const key of Object.keys(tree)) {
    const node = tree[key];

    if (node === undefined) {
      continue;
    }

    if (key === ROOT_KEY) {
      errors.root = toRootError(node);

      continue;
    }

    errors[key] = toFieldErrorValue(node);
  }

  return errors;
};

type ParseArchetypeParamsResult =
  | { ok: true; value: ArchetypeParams }
  | { ok: false; error: FieldErrors };

const finalizeArchetypeParams = (
  name: ArchetypeName,
  value: unknown,
): ParseArchetypeParamsResult => {
  const parsed = archetypeParamsSchema.safeParse({ archetype: name, params: value });

  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }

  return { ok: false, error: mapZodIssuesToFieldErrors(parsed.error.issues) };
};

export const parseArchetypeParams = (
  name: ArchetypeName,
  value: unknown,
): ParseArchetypeParamsResult => {
  switch (name) {
    case "n-rounds":
    case "alternating-sets":
    case "ladder-descending":
    case "ladder-ascending":
    case "ladder-vertex-down-pyramid":
    case "ladder-spike":
    case "parallel-ladders-descending":
    case "parallel-ladders-mixed-direction":
    case "parallel-pyramids":
    case "amrap-flat":
    case "emom-nested-per-minute":
    case "emom-sub-minute-slot":
    case "time-window-outer":
    case "composite-rounds-with-rest":
    case "composite-intervals-then-rounds":
    case "composite-intervals-work-rest-fixed":
    case "composite-intervals-work-rest-progressive":
    case "composite-intervals-on-off-max-tail":
    case "composite-rolling-rounds":
    case "nested-rounds-over-rounds":
    case "nested-rounds-over-parallel-ladder":
    case "nested-composite-rounds-over-ladder":
    case "named-themed-sets":
    case "named-exercise-program":
    case "single-line-with-then-connector":
    case "single-line-bare":
    case "single-line-total-counter":
    case "flat-list-headerless":
    case "pull-ups-dips-cycle":
    case "run-distance":
    case "placeholder-body":
    case "practice-list":
    case "url-only-body":
    case "super-set":
      return finalizeArchetypeParams(name, value);
    default:
      name satisfies never;

      return finalizeArchetypeParams(name, value);
  }
};
