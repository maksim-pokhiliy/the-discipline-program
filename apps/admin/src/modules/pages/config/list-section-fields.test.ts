import { describe, expect, it } from "vitest";

import { isListFieldKinds, SECTION_FIELD_KINDS } from "@repo/contracts/cms/pages";

import { SECTION_KEYS } from "../pages.fixtures";

import { LIST_SECTIONS } from "./list-section-fields";

describe("LIST_SECTIONS", () => {
  it("describes exactly the sections whose field registry holds a list", () => {
    const sections = SECTION_KEYS.filter((section) =>
      Object.values(SECTION_FIELD_KINDS[section]).some(isListFieldKinds),
    );

    expect(Object.keys(LIST_SECTIONS).sort()).toEqual(sections.sort());
  });

  it("names the registry's list and gives each visible row field a descriptor", () => {
    for (const [section, tree] of Object.entries(SECTION_FIELD_KINDS)) {
      const entry = Object.entries(LIST_SECTIONS).find(([key]) => key === section);

      if (entry === undefined) {
        continue;
      }

      const [, descriptor] = entry;
      const node = Object.entries(tree).find(([name]) => name === descriptor.name)?.[1];

      expect(node).toBeDefined();

      if (node !== undefined && isListFieldKinds(node)) {
        expect(Object.keys(descriptor.fields).sort()).toEqual(
          Object.keys(node.list)
            .filter((name) => name !== "id")
            .sort(),
        );
      } else {
        expect.fail(`${section}.${descriptor.name} is not a registered list`);
      }
    }
  });
});
