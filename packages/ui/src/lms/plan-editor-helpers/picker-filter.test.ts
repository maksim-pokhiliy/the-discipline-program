import { describe, expect, it } from "vitest";

import { filterPickerOptions, type PickerListOption } from "./picker-filter";

const options: PickerListOption[] = [
  { id: "tpl-1", label: "EMOM 5 minutes" },
  { id: "tpl-2", label: "Tabata sprints" },
  { id: "tpl-3", label: "AMRAP 12" },
];

describe("filterPickerOptions", () => {
  it("returns all options on blank query", () => {
    expect(filterPickerOptions(options, "")).toHaveLength(options.length);
  });

  it("matches by prefix first", () => {
    const result = filterPickerOptions(options, "amrap");

    expect(result[0]?.id).toBe("tpl-3");
  });

  it("returns empty when no match", () => {
    expect(filterPickerOptions(options, "zzz")).toHaveLength(0);
  });
});
