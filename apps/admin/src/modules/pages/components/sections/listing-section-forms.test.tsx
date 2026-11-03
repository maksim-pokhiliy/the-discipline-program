import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type z } from "zod";

import {
  blogGridSchema,
  homePageStorefrontProgramsSchema,
  type SectionSchemaKey,
  storefrontGridSchema,
} from "@repo/contracts/cms/pages";

import { clickButton, typeInto } from "@app/test/interactions";

import { makeSectionRow, renderSectionEditor } from "../../pages.fixtures";

const LISTING_SECTIONS: ReadonlyArray<[SectionSchemaKey, z.AnyZodObject]> = [
  ["home:storefront", homePageStorefrontProgramsSchema],
  ["storefront:grid", storefrontGridSchema],
  ["blog:grid", blogGridSchema],
];

describe("listing section forms", () => {
  it.each(LISTING_SECTIONS)("renders one input per field of the %s schema", (section, schema) => {
    renderSectionEditor(makeSectionRow(section, {}));

    expect(screen.getAllByRole("textbox")).toHaveLength(Object.keys(schema.shape).length);
  });

  it("saves an edited program card button label with the storefront grid section", async () => {
    const onSave = vi.fn();
    const title = "Fixture grid title";
    const cardActionLabel = "Fixture card action";

    renderSectionEditor(makeSectionRow("storefront:grid", {}), onSave);

    typeInto("Section Title", title);
    typeInto("Program Card Button Label", cardActionLabel);
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "storefront:grid",
        data: expect.objectContaining({ title, cardActionLabel }),
      }),
    );
  });
});
