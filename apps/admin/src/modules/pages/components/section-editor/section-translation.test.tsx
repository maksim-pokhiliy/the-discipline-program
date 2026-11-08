import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isListFieldKinds,
  SECTION_FIELD_KINDS,
  SECTION_SCHEMAS,
  SectionFieldKind,
  SectionTranslationState,
} from "@repo/contracts/cms/pages";

import type * as Api from "@app/lib/api";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { SECTION_LABELS } from "../../config/section-labels";
import { ENGLISH_LOCALE, UKRAINIAN_LOCALE } from "../../locale.fixtures";
import {
  makeLocalizedSectionRow,
  makePopulatedSectionRow,
  makeSectionRow,
  makeTranslatedRow,
  renderSectionEditor,
  SECTION_KEYS,
  sectionTextEntries,
} from "../../pages.fixtures";
import { fieldKindAt } from "../section-field/field-at-path";
import { SHARED_FIELD_HELPER } from "../section-field/section-field-context";

import { SectionEditor } from "./index";

const uploads = vi.hoisted(() => ({
  uploadImage: vi.fn<typeof Api.api.upload.uploadImage>(),
  deleteImage: vi.fn<typeof Api.api.upload.deleteImage>(),
}));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return { ...actual, api: { ...actual.api, upload: uploads } };
});

const NON_LIST_SECTION_KEYS = SECTION_KEYS.filter(
  (section) => !Object.values(SECTION_FIELD_KINDS[section]).some(isListFieldKinds),
);
const IMAGE_FIELDS = new Set(["backgroundImage", "image"]);
const SECTIONS_WITH_SHARED_TEXT = NON_LIST_SECTION_KEYS.filter((section) =>
  Object.entries(SECTION_FIELD_KINDS[section]).some(
    ([name, kind]) => kind === SectionFieldKind.SHARED && !IMAGE_FIELDS.has(name),
  ),
);
const SECTIONS_WITH_IMAGES = NON_LIST_SECTION_KEYS.filter((section) =>
  sectionTextEntries(makePopulatedSectionRow(section).data).some(([path]) =>
    IMAGE_FIELDS.has(path),
  ),
);
const STATE_LABELS = [
  [SectionTranslationState.NOT_TRANSLATED, "Not translated"],
  [SectionTranslationState.DRAFT, "Draft"],
  [SectionTranslationState.TRANSLATED, "Translated"],
  [SectionTranslationState.ENGLISH_NEWER, "English is newer"],
] as const;

beforeEach(() => {
  uploads.uploadImage.mockReset();
  uploads.deleteImage.mockReset();
});

describe("SectionEditor in a non-default locale", () => {
  it("opens a not-translated hero with empty words, English references and read-only shared values", () => {
    const english = SECTION_SCHEMAS["home:hero"].parse(makePopulatedSectionRow("home:hero").data);
    const row = makeTranslatedRow(
      "home:hero",
      {
        buttonHref: english.buttonHref,
        backgroundImage: english.backgroundImage,
      },
      {
        state: SectionTranslationState.NOT_TRANSLATED,
        english: { data: english, updatedAt: makeSectionRow("home:hero", {}).updatedAt },
      },
    );

    renderSectionEditor(row, vi.fn(), UKRAINIAN_LOCALE);

    for (const label of ["Title", "Subtitle", "Button Text"]) {
      expect(screen.getByLabelText(label)).toHaveValue("");
    }
    expect(screen.getByLabelText("Title")).toHaveAccessibleDescription(`English ${english.title}`);
    expect(screen.getByLabelText("Subtitle")).toHaveAccessibleDescription(
      `English ${english.subtitle}`,
    );
    expect(screen.getByLabelText("Button Text")).toHaveAccessibleDescription(
      `English ${english.buttonText}`,
    );
    expect(screen.getByLabelText("Button Link")).toHaveValue(english.buttonHref);
    expect(screen.getByLabelText("Button Link")).toHaveAttribute("readonly");
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute(
      "src",
      english.backgroundImage,
    );
    expect(screen.getByLabelText("Upload Image")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it.each(NON_LIST_SECTION_KEYS)("shows the English text beside every word of %s", (section) => {
    const english = makePopulatedSectionRow(section).data;
    const words = sectionTextEntries(english).filter(
      ([path]) => fieldKindAt(SECTION_FIELD_KINDS[section], path) === SectionFieldKind.WORD,
    );
    const { container } = renderSectionEditor(
      makeLocalizedSectionRow(section),
      vi.fn(),
      UKRAINIAN_LOCALE,
    );

    expect(words.length).toBeGreaterThan(0);
    for (const [path, text] of words) {
      const input = container.querySelector(`[name="${path}"]`);

      expect(input).toHaveValue(`Localized ${path}`);
      expect(input).toHaveAccessibleDescription(new RegExp(`^English ${text}`));
      expect(input).not.toHaveAttribute("readonly");
    }
  });

  it.each(SECTIONS_WITH_SHARED_TEXT)("keeps the shared fields of %s read-only", (section) => {
    const shared = sectionTextEntries(makePopulatedSectionRow(section).data).filter(
      ([path]) =>
        fieldKindAt(SECTION_FIELD_KINDS[section], path) === SectionFieldKind.SHARED &&
        !IMAGE_FIELDS.has(path),
    );
    const { container } = renderSectionEditor(
      makeLocalizedSectionRow(section),
      vi.fn(),
      UKRAINIAN_LOCALE,
    );

    expect(shared.length).toBeGreaterThan(0);
    for (const [path] of shared) {
      expect(container.querySelector(`[name="${path}"]`)).toHaveAttribute("readonly");
      expect(container.querySelector(`[name="${path}"]`)).toHaveAccessibleDescription(
        SHARED_FIELD_HELPER,
      );
    }
  });

  it.each(NON_LIST_SECTION_KEYS)(
    "gives every text input of %s a word or shared field",
    (section) => {
      const expected = sectionTextEntries(makePopulatedSectionRow(section).data)
        .map(([path]) => path)
        .filter((path) => !IMAGE_FIELDS.has(path));

      renderSectionEditor(makeLocalizedSectionRow(section), vi.fn(), UKRAINIAN_LOCALE);

      const inputs = screen.getAllByRole("textbox");

      expect(inputs.map((input) => input.getAttribute("name")).sort()).toEqual(expected.sort());
      for (const input of inputs) {
        const name = input.getAttribute("name") ?? "";

        expect(Object.values(SectionFieldKind)).toContain(
          fieldKindAt(SECTION_FIELD_KINDS[section], name),
        );
      }
    },
  );

  it.each(STATE_LABELS)("marks a %s section before it is opened", (state, label) => {
    render(
      <SectionEditor
        section={makeLocalizedSectionRow("home:hero", state)}
        locale={UKRAINIAN_LOCALE}
        isExpanded={false}
        onToggle={vi.fn()}
        onSave={vi.fn()}
        isLoading={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: `${SECTION_LABELS["home:hero"]} ${label}` }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("enables Update Section without an edit on an English newer section", async () => {
    const row = makeLocalizedSectionRow("home:hero", SectionTranslationState.ENGLISH_NEWER);
    const onSave = vi.fn();

    renderSectionEditor(row, onSave, UKRAINIAN_LOCALE);
    expect(
      screen.getByText(/English changed after this translation was saved/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({ section: row.section, data: row.data }),
    );
  });

  it("keeps Update Section disabled on a clean translated section", () => {
    renderSectionEditor(makeLocalizedSectionRow("home:hero"), vi.fn(), UKRAINIAN_LOCALE);

    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("clears the translation with exactly {} after the confirmation", () => {
    const onSave = vi.fn();

    renderSectionEditor(
      makeLocalizedSectionRow("home:hero", SectionTranslationState.DRAFT),
      onSave,
      UKRAINIAN_LOCALE,
    );
    typeInto("Title", "Unsaved replacement");
    clickButton("Clear Translation");

    const dialog = screen.getByRole("dialog", { name: "Clear the Ukrainian translation?" });

    expect(
      within(dialog).getByText(
        `The Ukrainian words written for ${SECTION_LABELS["home:hero"]} are removed, and the Ukrainian site shows this section in English.`,
      ),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Clear Translation" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ section: "home:hero", data: {} });
  });

  it("keeps the translation when the confirmation is cancelled", () => {
    const onSave = vi.fn();

    renderSectionEditor(makeLocalizedSectionRow("home:hero"), onSave, UKRAINIAN_LOCALE);
    clickButton("Clear Translation");
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Title")).toHaveValue("Localized title");
  });

  it.each(STATE_LABELS)("offers Clear Translation only for written words in state %s", (state) => {
    renderSectionEditor(makeLocalizedSectionRow("home:hero", state), vi.fn(), UKRAINIAN_LOCALE);

    expect(screen.queryByRole("button", { name: "Clear Translation" }) !== null).toBe(
      state !== SectionTranslationState.NOT_TRANSLATED,
    );
  });

  it("offers neither a state mark nor Clear Translation in English", () => {
    renderSectionEditor(makePopulatedSectionRow("home:hero"), vi.fn(), ENGLISH_LOCALE);

    for (const [, label] of STATE_LABELS) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Clear Translation" })).not.toBeInTheDocument();
  });

  it.each(SECTIONS_WITH_IMAGES)(
    "shows the %s image without a Remove control outside English",
    async (section) => {
      const image = sectionTextEntries(makePopulatedSectionRow(section).data).find(([path]) =>
        IMAGE_FIELDS.has(path),
      );

      renderSectionEditor(makeLocalizedSectionRow(section), vi.fn(), UKRAINIAN_LOCALE);

      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", image?.[1]);
      expect(screen.getByLabelText("Upload Image")).toBeDisabled();
      expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Upload Image"), {
          target: { files: [new File(["fixture image"], "fixture.png", { type: "image/png" })] },
        });
      });
      expect(uploads.uploadImage).not.toHaveBeenCalled();
      expect(uploads.deleteImage).not.toHaveBeenCalled();
    },
  );

  it("shows the unreadable-row notice", () => {
    const row = {
      ...makeLocalizedSectionRow("home:hero", SectionTranslationState.NOT_TRANSLATED),
      hasUnreadableData: true,
    };

    renderSectionEditor(row, vi.fn(), UKRAINIAN_LOCALE);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The saved content of this section could not be read and is not shown on the site. Saving the form replaces it.",
    );
  });
});
