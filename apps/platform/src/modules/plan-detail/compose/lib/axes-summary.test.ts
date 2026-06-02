import { describe, expect, it } from "vitest";

import type { RestDurationUnit } from "@repo/contracts/lms/_shared";

import type { ComposeContainer, RestAxis } from "../compose-tree.types";

import { buildAxesSummary } from "./axes-summary";
import { asNodeId } from "./id-factory";

const MINUTE_MARK = "’";
const SECOND_MARK = " sec";

const containerWithRest = (rest: RestAxis): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("rest-summary-container"),
  header: null,
  notes: null,
  rest,
  children: [],
});

const restLabelFor = (rest: RestAxis): string => {
  const parts = buildAxesSummary(containerWithRest(rest));
  const label = parts.find((part) => part.startsWith("rest"));

  if (label === undefined) {
    throw new Error("expected a rest label in the axes summary");
  }

  return label;
};

const UNIT_EXPECTATIONS: { unit: RestDurationUnit; mark: string; rest: RestAxis }[] = [
  {
    unit: "sec",
    mark: SECOND_MARK,
    rest: { duration: { value: 90, unit: "sec" }, scope: "between_sets" },
  },
  {
    unit: "min",
    mark: MINUTE_MARK,
    rest: { duration: { value: 2, unit: "min" }, scope: "between_rounds" },
  },
  {
    unit: "range_sec",
    mark: SECOND_MARK,
    rest: { duration: { value: 30, unit: "range_sec", rangeMax: 60 }, scope: "between_sets" },
  },
  {
    unit: "range_min",
    mark: MINUTE_MARK,
    rest: { duration: { value: 3, unit: "range_min", rangeMax: 5 }, scope: "between_rounds" },
  },
];

describe("buildAxesSummary rest-unit marks (regression: range_min shows minutes, not seconds)", () => {
  it.each(UNIT_EXPECTATIONS)("renders the $unit unit with the $mark mark", ({ mark, rest }) => {
    expect(restLabelFor(rest).endsWith(mark)).toBe(true);
  });
});
