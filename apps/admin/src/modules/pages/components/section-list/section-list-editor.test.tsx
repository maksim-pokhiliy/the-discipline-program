import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SECTION_FIELD_KINDS, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { clickButton, typeInto, typeIntoNth } from "@app/test/interactions";

import { LIST_SECTIONS } from "../../config/list-section-fields";
import { makeListAddCases, makeListReorderCases } from "../../list-editor.fixtures";
import { makeSectionRow, renderSectionEditor } from "../../pages.fixtures";

const TITLE = "Fixture list title";
const SUBTITLE = "Fixture list subtitle";
const ROW_NAMES = ["First", "Second", "Third"];
const LAST_ROW = 3;
const rowWords = (fields: Readonly<Record<string, { label: string }>>, name: string) =>
  Object.fromEntries(Object.keys(fields).map((field) => [field, `${name} ${field}`]));

const expectUnavailable = (name: string): void => {
  const button = screen.getByRole("button", { name });

  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).not.toHaveAttribute("disabled");
};

describe("SectionListEditor in English", () => {
  it.each(makeListAddCases())(
    "starts $section with no rows and an add control",
    ({ section, list }) => {
      renderSectionEditor(makeSectionRow(section, {}));

      expect(screen.getByText(`${list.countLabel} (0)`)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: list.addLabel })).toBeEnabled();
      for (const field of Object.values(list.fields)) {
        expect(screen.queryByLabelText(field.label)).not.toBeInTheDocument();
      }
    },
  );

  it.each(makeListAddCases())(
    "adds, moves and removes rows of $section and saves fresh ids",
    async ({ section, list }) => {
      const onSave = vi.fn();
      const hasSubtitle = "subtitle" in SECTION_FIELD_KINDS[section];
      const expectedRows = ROW_NAMES.map((name) => ({
        id: expect.any(String),
        ...rowWords(list.fields, name),
      }));

      renderSectionEditor(makeSectionRow(section, {}), onSave);
      typeInto("Section Title", TITLE);

      if (hasSubtitle) {
        typeInto("Section Subtitle", SUBTITLE);
      }

      ROW_NAMES.forEach((name, index) => {
        clickButton(list.addLabel);
        for (const [fieldName, field] of Object.entries(list.fields)) {
          typeIntoNth(field.label, index, `${name} ${fieldName}`);
        }
      });
      expectUnavailable(`Move ${list.itemName} 1 up`);
      expectUnavailable(`Move ${list.itemName} ${LAST_ROW} down`);
      clickButton(`Move ${list.itemName} 2 up`);
      clickButton(`Remove ${list.itemName} ${LAST_ROW}`);
      expect(screen.getByText(`${list.countLabel} (2)`)).toBeInTheDocument();
      clickButton("Update Section");

      await waitFor(() =>
        expect(onSave).toHaveBeenCalledExactlyOnceWith({
          section,
          data: {
            title: TITLE,
            ...(hasSubtitle && { subtitle: SUBTITLE }),
            [list.name]: [expectedRows[1], expectedRows[0]],
          },
        }),
      );
      const body = onSave.mock.calls[0]?.[0];
      const rows = body?.data[list.name];

      expect(rows).toHaveLength(2);
      expect(rows?.[0]?.id).not.toBe(rows?.[1]?.id);
      for (const field of Object.values(list.fields)) {
        const inputs = screen.getAllByLabelText(field.label);

        expect(
          inputs.every((input) =>
            input.closest(".MuiInputBase-root")?.classList.contains("MuiInputBase-sizeSmall"),
          ),
        ).toBe(true);

        if ("minRows" in field) {
          expect(inputs.map((input) => input.tagName)).toEqual(["TEXTAREA", "TEXTAREA"]);
        }
      }
    },
  );

  it.each(makeListReorderCases())(
    "moves populated $row.section rows without dropping any field",
    async ({ row, expectedBody }) => {
      const list = Object.entries(LIST_SECTIONS).find(([section]) => section === row.section)?.[1];
      const onSave = vi.fn();

      if (list === undefined) {
        throw new Error(`No descriptor for ${row.section}`);
      }

      renderSectionEditor(row, onSave);
      clickButton(`Move ${list.itemName} 1 down`);
      clickButton(`Move ${list.itemName} 2 down`);
      clickButton("Update Section");

      await waitFor(() => expect(onSave).toHaveBeenCalledExactlyOnceWith(expectedBody));
    },
  );

  it("keeps focus on the moved FAQ row's control at the top edge", () => {
    const row = makeListReorderCases().find(({ row }) => row.section === "faq:content")?.row;

    if (row === undefined) {
      throw new Error("Missing FAQ fixture");
    }

    renderSectionEditor(row);
    const button = screen.getByRole("button", { name: "Move FAQ item 2 up" });

    button.focus();
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Move FAQ item 1 up" })).toBe(button);
    expect(button).toHaveFocus();
    expectUnavailable("Move FAQ item 1 up");
  });

  it.each<{
    section: SectionSchemaKey;
    cardTitle: string;
    countLabel: string;
    addLabel: string;
    labels: string[];
    columns: [string, string][];
  }>([
    {
      section: "home:whyChoose",
      cardTitle: "Why Choose Us Settings",
      countLabel: "Feature Cards",
      addLabel: "Add New Card",
      labels: ["Section Title", "Section Subtitle", "Icon Name", "Feature Title", "Description"],
      columns: [
        ["Icon Name", "MuiGrid-grid-sm-4"],
        ["Feature Title", "MuiGrid-grid-sm-8"],
      ],
    },
    {
      section: "about:journey",
      cardTitle: "Journey Section Settings",
      countLabel: "Timeline",
      addLabel: "Add Timeline Item",
      labels: ["Section Title", "Section Subtitle", "Year", "Title", "Description"],
      columns: [
        ["Year", "MuiGrid-grid-sm-2"],
        ["Title", "MuiGrid-grid-sm-10"],
      ],
    },
    {
      section: "about:credentials",
      cardTitle: "Credentials Section Settings",
      countLabel: "Credentials",
      addLabel: "Add Credential",
      labels: ["Section Title", "Section Subtitle", "Title", "Description"],
      columns: [],
    },
    {
      section: "faq:content",
      cardTitle: "FAQ Settings",
      countLabel: "FAQ Items",
      addLabel: "Add FAQ Item",
      labels: ["Section Title", "Section Subtitle", "Question", "Answer"],
      columns: [],
    },
    {
      section: "offer:requisites",
      cardTitle: "Requisites Settings",
      countLabel: "Requisites",
      addLabel: "Add Requisite",
      labels: ["Section Title", "Label", "Value"],
      columns: [
        ["Label", "MuiGrid-grid-sm-4"],
        ["Value", "MuiGrid-grid-sm-8"],
      ],
    },
    {
      section: "offer:terms",
      cardTitle: "Terms Settings",
      countLabel: "Terms Blocks",
      addLabel: "Add Terms Block",
      labels: ["Section Title", "Heading", "Body"],
      columns: [],
    },
  ])(
    "keeps $section's original English labels and columns under the real theme",
    ({ section, cardTitle, countLabel, addLabel, labels, columns }) => {
      const row = makeListReorderCases().find(({ row }) => row.section === section)?.row;

      if (row === undefined) {
        throw new Error(`Missing ${section} fixture`);
      }

      renderSectionEditor(row);

      expect(screen.getByText(cardTitle)).toBeInTheDocument();
      expect(screen.getByText(`${countLabel} (3)`)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: addLabel })).toBeEnabled();
      for (const label of labels) {
        expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
      }
      for (const [label, gridClass] of columns) {
        for (const field of screen.getAllByLabelText(label)) {
          expect(field.closest(".MuiGrid-root")).toHaveClass(gridClass);
        }
      }
    },
  );
});
