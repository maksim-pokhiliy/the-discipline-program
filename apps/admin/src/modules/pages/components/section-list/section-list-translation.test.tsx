import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SECTION_FIELD_KINDS, SectionFieldKind } from "@repo/contracts/cms/pages";

import { makeListAddCases } from "../../list-editor.fixtures";
import { UKRAINIAN_LOCALE } from "../../locale.fixtures";
import {
  makeLocalizedSectionRow,
  makePopulatedSectionRow,
  renderSectionEditor,
  sectionTextEntries,
} from "../../pages.fixtures";
import { fieldKindAt } from "../section-field/field-at-path";
import { SHARED_FIELD_HELPER } from "../section-field/section-field-context";

describe("SectionListEditor in another language", () => {
  it.each(makeListAddCases())(
    "shows every word of every $section row beside its English without structure controls",
    ({ section, list }) => {
      const english = makePopulatedSectionRow(section).data;
      const words = sectionTextEntries(english).filter(
        ([path]) => fieldKindAt(SECTION_FIELD_KINDS[section], path) === SectionFieldKind.WORD,
      );
      const { container } = renderSectionEditor(
        makeLocalizedSectionRow(section),
        vi.fn(),
        UKRAINIAN_LOCALE,
      );

      expect(
        screen.queryByRole("button", { name: /^Add |^Move |^Remove / }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("Rows are added, moved and removed in English.")).toBeInTheDocument();
      expect(screen.getByText(`${list.countLabel} (2)`)).toBeInTheDocument();
      for (const [path, text] of words) {
        const input = container.querySelector(`[name="${path}"]`);

        expect(input).toHaveValue(`Localized ${path}`);
        expect(input).toHaveAccessibleDescription(new RegExp(`^English ${text}`));
        expect(input).not.toHaveAttribute("readonly");
      }
      for (const [fieldName, field] of Object.entries(list.fields)) {
        const inputs = screen.getAllByLabelText(field.label);

        expect(inputs).toHaveLength(2);
        inputs.forEach((input, index) => {
          const path = `${list.name}.${index}.${fieldName}`;

          expect(input).toHaveAttribute("name", path);
          expect(input.closest(".MuiInputBase-root")).toHaveClass("MuiInputBase-sizeSmall");
        });
      }
      expect(container.querySelector(`[name="${list.name}.0.id"]`)).not.toBeInTheDocument();
    },
  );

  it("keeps both Why Choose icons read-only with their English values", () => {
    renderSectionEditor(makeLocalizedSectionRow("home:whyChoose"), vi.fn(), UKRAINIAN_LOCALE);

    screen.getAllByLabelText("Icon Name").forEach((input, index) => {
      expect(input).toHaveAttribute("readonly");
      expect(input).toHaveValue(`English features.${index}.iconName`);
      expect(input).toHaveAccessibleDescription(SHARED_FIELD_HELPER);
    });
  });

  it.each(makeListAddCases())(
    "gives every translated $section row field the full width and a reference half from md",
    ({ section, list }) => {
      const { container } = renderSectionEditor(
        makeLocalizedSectionRow(section),
        vi.fn(),
        UKRAINIAN_LOCALE,
      );

      for (const [name] of Object.entries(list.fields)) {
        for (const index of [0, 1]) {
          const input = container.querySelector(`[name="${list.name}.${index}.${name}"]`);
          const inputCell = input?.closest(".MuiGrid-root");
          const isWord =
            fieldKindAt(SECTION_FIELD_KINDS[section], `${list.name}.${index}.${name}`) ===
            SectionFieldKind.WORD;
          const fieldCell = isWord ? inputCell?.parentElement?.parentElement : inputCell;

          expect(fieldCell).toHaveClass("MuiGrid-grid-xs-12");
          expect(fieldCell?.className).not.toMatch(/MuiGrid-grid-sm-/);

          if (isWord) {
            expect(inputCell).toHaveClass("MuiGrid-grid-md-6");
            expect(inputCell?.previousElementSibling).toHaveClass("MuiGrid-grid-md-6");
          }
        }
      }
    },
  );
});
