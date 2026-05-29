import type { FieldError, FieldErrors, FieldErrorsImpl, GlobalError, Merge } from "react-hook-form";
import type { z } from "zod";

import { restSpecSchema } from "@repo/contracts/lms/_shared";
import {
  type RowKind,
  type SchemaRowPayload,
  schemaRowPayloadSchema,
} from "@repo/contracts/lms/schema-row";

import { formatRestSpec } from "../lib/format-rest-spec";

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
    const relative = [...issue.path];

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

type ParseRowPayloadResult =
  | { ok: true; value: SchemaRowPayload }
  | { ok: false; error: FieldErrors };

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? { ...value } : {};

const finalizeRowPayload = (rowKind: RowKind, value: unknown): ParseRowPayloadResult => {
  const parsed = schemaRowPayloadSchema.safeParse({ rowKind, ...toRecord(value) });

  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }

  return { ok: false, error: mapZodIssuesToFieldErrors(parsed.error.issues) };
};

export const parseRowPayload = (rowKind: RowKind, value: unknown): ParseRowPayloadResult => {
  switch (rowKind) {
    case "EXERCISE":
    case "REST":
    case "FOOTNOTE":
    case "STANDALONE_LOAD":
    case "STANDALONE_URL":
    case "PLACEHOLDER":
    case "INNER_LADDER_MARKER":
    case "REP_DEFINITION":
    case "REST_SLOT":
      return finalizeRowPayload(rowKind, value);
    default:
      rowKind satisfies never;

      return finalizeRowPayload(rowKind, value);
  }
};

const STANDALONE_LOAD_SCOPE = "applies_to_all_preceding_rows";

type AssembledRowPayload = {
  payloadInput: Record<string, unknown>;
  notes: string | null;
};

const readString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const toNotes = (value: unknown): string | null => {
  const raw = readString(value);

  if (raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  return trimmed === "" ? null : trimmed;
};

const resolveRestRaw = (record: Record<string, unknown>): string => {
  const typed = readString(record.raw);

  if (typed !== undefined && typed.trim() !== "") {
    return typed.trim();
  }

  const parsed = restSpecSchema.safeParse(record.parsed);

  return parsed.success ? formatRestSpec(parsed.data) : "";
};

export const assembleRowPayloadAndNotes = (
  rowKind: RowKind,
  rawValue: unknown,
): AssembledRowPayload => {
  const record = toRecord(rawValue);

  switch (rowKind) {
    case "REST":
      return {
        payloadInput: { parsed: record.parsed, raw: resolveRestRaw(record) },
        notes: toNotes(record.notes),
      };
    case "STANDALONE_LOAD":
      return {
        payloadInput: { load: record.load, scope: STANDALONE_LOAD_SCOPE },
        notes: toNotes(record.notes),
      };
    case "STANDALONE_URL":
      return {
        payloadInput: { url: record.url, wrapped: record.wrapped, appliesTo: record.appliesTo },
        notes: null,
      };
    case "INNER_LADDER_MARKER":
      return { payloadInput: { steps: record.steps }, notes: null };
    case "REST_SLOT":
      return { payloadInput: {}, notes: toNotes(record.notes) };
    case "EXERCISE":
    case "FOOTNOTE":
    case "PLACEHOLDER":
    case "REP_DEFINITION":
      return { payloadInput: record, notes: toNotes(record.notes) };
    default:
      rowKind satisfies never;

      return { payloadInput: record, notes: toNotes(record.notes) };
  }
};
