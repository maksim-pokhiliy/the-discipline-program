import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type z } from "zod";

import {
  type SectionSchemaKey,
  siteErrorsSchema,
  siteFooterSchema,
  siteLeadFormSchema,
  siteNavigationSchema,
} from "@repo/contracts/cms/pages";

import { clickButton, typeInto } from "@app/test/interactions";

import { makeSectionRow, renderSectionEditor } from "../../pages.fixtures";

const SITE_SECTIONS: ReadonlyArray<[SectionSchemaKey, z.AnyZodObject]> = [
  ["site:navigation", siteNavigationSchema],
  ["site:footer", siteFooterSchema],
  ["site:leadForm", siteLeadFormSchema],
  ["site:errors", siteErrorsSchema],
];

const makeFooterData = () => ({
  tagline: "Fixture tagline",
  subcopy: "Fixture closing line",
  rightsLabel: "Fixture copyright",
});

describe("FlatFieldsSectionForm", () => {
  it.each(SITE_SECTIONS)("renders one input per field of the %s schema", (section, schema) => {
    renderSectionEditor(makeSectionRow(section, {}));

    expect(screen.getAllByRole("textbox")).toHaveLength(Object.keys(schema.shape).length);
  });

  it("heads the navigation fields with their groups", () => {
    renderSectionEditor(makeSectionRow("site:navigation", {}));

    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Screen Reader Labels")).toBeInTheDocument();
    expect(screen.getByLabelText("Storefront Link")).toBeInTheDocument();
    expect(screen.getByLabelText("Open-Menu Button")).toBeInTheDocument();
  });

  it("shows the stored values and saves an edited footer tagline", async () => {
    const onSave = vi.fn();
    const data = makeFooterData();
    const tagline = "Edited fixture tagline";

    renderSectionEditor(makeSectionRow("site:footer", data), onSave);

    expect(screen.getByLabelText("Tagline")).toHaveValue(data.tagline);
    expect(screen.getByLabelText("Closing Line")).toHaveValue(data.subcopy);
    expect(screen.getByLabelText("Copyright Notice")).toHaveValue(data.rightsLabel);
    typeInto("Tagline", tagline);
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "site:footer",
        data: { ...data, tagline },
      }),
    );
  });
});
