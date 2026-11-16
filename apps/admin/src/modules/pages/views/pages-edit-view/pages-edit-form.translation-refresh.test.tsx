import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AdminPageDetails,
  PageSlug,
  SectionTranslationState,
} from "@repo/contracts/cms/pages";

import { api } from "@app/lib/api";
import type * as Hooks from "@app/lib/hooks";
import { clickButton, typeInto, typeIntoNth } from "@app/test/interactions";
import { render } from "@app/test/render";

import { LOCALE_CATALOG, UKRAINIAN_LOCALE } from "../../locale.fixtures";
import { makePage, makeTranslatedRow } from "../../pages.fixtures";

import { makeLocaleFaqPage } from "./page-locale.fixtures";
import { PagesEditForm } from "./pages-edit-form";

const { updateSection } = vi.hoisted(() => ({ updateSection: vi.fn() }));

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdatePageSection: () => ({ mutate: updateSection }),
    useIsPageSectionSaving: () => false,
  };
});

const A = { id: "a", question: "Question A", answer: "Answer A" };
const B = { id: "b", question: "Question B", answer: "Answer B" };
const C = { id: "c", question: "Question C", answer: "Answer C" };
const D = { id: "d", question: "Question D", answer: "Answer D" };
const WORDS = { items: [{ id: "b", answer: "Saved answer B" }] };
const TYPED = "Unsaved answer B";

const makeFeaturePage = (iconName: string): AdminPageDetails => {
  const feature = { id: "a", title: "English feature", description: "English detail", iconName };
  const english = { title: "English section", subtitle: "English subtitle", features: [feature] };
  const data = { ...english, features: [{ ...feature, title: "Saved title", description: "" }] };
  const row = makeTranslatedRow("home:whyChoose", data, {
    state: SectionTranslationState.DRAFT,
    english: { data: english, updatedAt: "2026-11-02T09:00:00.000Z" },
  });

  return { ...makePage(PageSlug.HOME, [row]), locale: "uk" };
};

beforeEach(() => {
  vi.spyOn(api.locales, "list").mockResolvedValue(LOCALE_CATALOG);
});

afterEach(() => {
  vi.restoreAllMocks();
  updateSection.mockReset();
});

describe("PagesEditForm keeps unsaved words across a refresh", () => {
  it("keeps typed b words after removing a, moving b, changing c and adding d without remounting the section", () => {
    const words = {
      ...WORDS,
      title: "Local FAQ",
      items: [...WORDS.items, { id: "c", question: "Local C" }],
    };
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([A, B, C], words)} locale={UKRAINIAN_LOCALE} />,
    );
    const title = screen.getByLabelText("Section Title");

    typeInto("Section Title", "Unsaved FAQ title");
    typeIntoNth("Answer", 1, TYPED);
    rerender(
      <PagesEditForm
        page={makeLocaleFaqPage([B, { ...C, question: "Changed question C" }, D], words)}
        locale={UKRAINIAN_LOCALE}
      />,
    );

    expect(screen.getByLabelText("Section Title")).toBe(title);
    expect(title).toHaveValue("Unsaved FAQ title");
    expect(screen.getAllByLabelText("Answer")).toHaveLength(3);
    expect(screen.getAllByLabelText("Answer")[0]).toHaveValue(TYPED);
    expect(screen.getAllByLabelText("Answer")[0]).toHaveAccessibleDescription("English Answer B");
    expect(screen.getAllByLabelText("Question")[1]).toHaveAccessibleDescription(
      "English Changed question C",
    );
    expect(screen.getAllByLabelText("Question")[2]).toHaveValue("");
    expect(screen.getAllByLabelText("Answer")[2]).toHaveValue("");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });

  it("keeps a typed word when English empties it and shows the empty reference", () => {
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([B], WORDS)} locale={UKRAINIAN_LOCALE} />,
    );

    typeInto("Answer", TYPED);
    rerender(
      <PagesEditForm
        page={makeLocaleFaqPage([{ ...B, answer: "" }], WORDS)}
        locale={UKRAINIAN_LOCALE}
      />,
    );

    expect(screen.getByLabelText("Answer")).toHaveValue(TYPED);
    expect(screen.getByLabelText("Answer")).toHaveAccessibleDescription("English No English text");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });

  it("adopts a changed English icon while keeping the typed feature title", () => {
    const { rerender } = render(
      <PagesEditForm page={makeFeaturePage("OldIcon")} locale={UKRAINIAN_LOCALE} />,
    );

    typeInto("Feature Title", "Unsaved feature title");
    rerender(<PagesEditForm page={makeFeaturePage("NewIcon")} locale={UKRAINIAN_LOCALE} />);

    expect(screen.getByLabelText("Icon Name")).toHaveValue("NewIcon");
    expect(screen.getByLabelText("Icon Name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Feature Title")).toHaveValue("Unsaved feature title");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });

  it("lands clean when its own save refresh carries the typed words", async () => {
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([B], WORDS)} locale={UKRAINIAN_LOCALE} />,
    );

    typeInto("Answer", TYPED);
    clickButton("Update Section");

    await waitFor(() =>
      expect(updateSection).toHaveBeenCalledExactlyOnceWith({
        section: "faq:content",
        data: { title: "", subtitle: "", items: [{ id: "b", question: "", answer: TYPED }] },
      }),
    );
    rerender(
      <PagesEditForm
        page={makeLocaleFaqPage([B], { items: [{ id: "b", answer: TYPED }] })}
        locale={UKRAINIAN_LOCALE}
      />,
    );

    expect(screen.getByLabelText("Answer")).toHaveValue(TYPED);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("discards unsaved words immediately on Clear and leaves the cleared refresh clean", () => {
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([B], WORDS)} locale={UKRAINIAN_LOCALE} />,
    );
    const saveButton = screen.getByRole("button", { name: "Update Section" });

    typeInto("Answer", TYPED);
    clickButton("Clear Translation");

    expect(updateSection).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Clear Translation" }),
    );

    expect(screen.getByLabelText("Answer")).toHaveValue("Saved answer B");
    expect(saveButton).toBeDisabled();
    expect(updateSection).toHaveBeenCalledExactlyOnceWith({ section: "faq:content", data: {} });
    rerender(<PagesEditForm page={makeLocaleFaqPage([B])} locale={UKRAINIAN_LOCALE} />);

    expect(screen.getByLabelText("Answer")).toHaveValue("");
    expect(screen.getByLabelText("Question")).toHaveValue("");
    expect(saveButton).toBeDisabled();
  });

  it("shrinks a server-filled row word's label on refresh", () => {
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([B])} locale={UKRAINIAN_LOCALE} />,
    );

    expect(screen.getByText("Answer", { selector: "label" })).toHaveAttribute(
      "data-shrink",
      "false",
    );
    rerender(
      <PagesEditForm
        page={makeLocaleFaqPage([B], { items: [{ id: "b", answer: "Server-filled answer" }] })}
        locale={UKRAINIAN_LOCALE}
      />,
    );

    expect(screen.getByLabelText("Answer")).toHaveValue("Server-filled answer");
    expect(screen.getByText("Answer", { selector: "label" })).toHaveAttribute(
      "data-shrink",
      "true",
    );
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("keeps the row element and dirty words through a JSON-equal seed refresh", () => {
    const { rerender } = render(
      <PagesEditForm page={makeLocaleFaqPage([B], WORDS)} locale={UKRAINIAN_LOCALE} />,
    );
    const answer = screen.getByLabelText("Answer");

    typeInto("Answer", TYPED);
    rerender(
      <PagesEditForm
        page={makeLocaleFaqPage([B], structuredClone(WORDS))}
        locale={UKRAINIAN_LOCALE}
      />,
    );

    expect(screen.getByLabelText("Answer")).toBe(answer);
    expect(answer).toHaveValue(TYPED);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });
});
