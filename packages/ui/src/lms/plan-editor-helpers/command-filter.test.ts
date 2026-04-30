import { describe, expect, it } from "vitest";

import { type CommandListEntry, filterCommandList } from "./command-filter";

const commands: CommandListEntry[] = [
  {
    id: "plan.create-week",
    title: "Create week",
    group: "Plan",
    keywords: ["new", "add"],
  },
  {
    id: "plan.duplicate-week",
    title: "Duplicate current week",
    group: "Plan",
    keywords: ["copy", "clone"],
  },
  {
    id: "plan.search",
    title: "Search across plan",
    group: "Navigation",
    keywords: ["find"],
  },
];

describe("filterCommandList", () => {
  it("returns the full set when query is blank", () => {
    expect(filterCommandList(commands, "")).toHaveLength(commands.length);
  });

  it("ranks prefix matches above substring matches", () => {
    const result = filterCommandList(commands, "create");

    expect(result[0]?.id).toBe("plan.create-week");
  });

  it("matches via keywords", () => {
    const result = filterCommandList(commands, "clone");

    expect(result.map((c) => c.id)).toContain("plan.duplicate-week");
  });

  it("filters out non-matches", () => {
    const result = filterCommandList(commands, "foo-bar-baz");

    expect(result).toHaveLength(0);
  });
});
