import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@app/lib/api";
import { readMockNavigationCalls, resetMockNavigation, setMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import {
  ENGLISH_LOCALE,
  HIDDEN_LOCALE,
  LOCALE_CATALOG,
  UKRAINIAN_LOCALE,
} from "../../locale.fixtures";
import { LanguageBar } from "../language-bar";

import { LanguageSwitch } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

const openLanguages = (): void => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: "Language" }));
};

beforeEach(() => {
  resetMockNavigation();
  vi.spyOn(api.locales, "list").mockResolvedValue(LOCALE_CATALOG);
});
afterEach(() => {
  resetMockNavigation();
  vi.restoreAllMocks();
});

describe("LanguageSwitch", () => {
  it("lists every language in catalog order with English first and marked default", () => {
    render(<LanguageSwitch locale={ENGLISH_LOCALE} catalog={LOCALE_CATALOG} onChange={vi.fn()} />);
    openLanguages();

    expect(
      screen.getAllByRole("option").map((option) => option.getAttribute("data-value")),
    ).toEqual(LOCALE_CATALOG.map(({ code }) => code));
    expect(
      within(screen.getByRole("option", { name: /English/ })).getByText("Default"),
    ).toBeInTheDocument();
    expect(screen.getByText("Language", { selector: "label" })).toHaveAttribute(
      "data-shrink",
      "true",
    );
  });

  it("keeps the catalog order when it differs from alphabetical order", () => {
    const catalog = [...LOCALE_CATALOG].reverse();

    render(<LanguageSwitch locale={ENGLISH_LOCALE} catalog={catalog} onChange={vi.fn()} />);
    openLanguages();

    expect(
      screen.getAllByRole("option").map((option) => option.getAttribute("data-value")),
    ).toEqual(catalog.map(({ code }) => code));
  });

  it("marks a disabled language hidden from the site and keeps it selectable", () => {
    const onChange = vi.fn();

    render(<LanguageSwitch locale={ENGLISH_LOCALE} catalog={LOCALE_CATALOG} onChange={onChange} />);
    openLanguages();

    const option = screen.getByRole("option", { name: /German/ });

    expect(within(option).getByText("Hidden from site")).toBeInTheDocument();
    expect(option).not.toHaveAttribute("aria-disabled", "true");
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(HIDDEN_LOCALE.code);
  });

  it("offers only the current language until the catalog loads", () => {
    render(<LanguageSwitch locale={UKRAINIAN_LOCALE} catalog={undefined} onChange={vi.fn()} />);
    openLanguages();

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: UKRAINIAN_LOCALE.name })).toBeInTheDocument();
  });

  it("replaces the locale in the URL and keeps the open section", async () => {
    setMockNavigation({ pathname: "/pages/home", search: "section=home%3Ahero&locale=de" });
    render(<LanguageBar locale={HIDDEN_LOCALE} />);
    openLanguages();
    fireEvent.click(await screen.findByRole("option", { name: UKRAINIAN_LOCALE.name }));

    expect(readMockNavigationCalls()).toEqual({
      push: [],
      replace: ["/pages/home?section=home%3Ahero&locale=uk"],
    });
  });

  it("drops the locale from the URL for English", async () => {
    setMockNavigation({ pathname: "/pages/home", search: "section=home%3Ahero&locale=uk" });
    render(<LanguageBar locale={UKRAINIAN_LOCALE} />);
    openLanguages();
    fireEvent.click(await screen.findByRole("option", { name: /English/ }));

    expect(readMockNavigationCalls()).toEqual({
      push: [],
      replace: ["/pages/home?section=home%3Ahero"],
    });
  });

  it("leaves no trailing question mark when English has no other query params", async () => {
    setMockNavigation({ pathname: "/pages", search: "locale=uk" });
    render(<LanguageBar locale={UKRAINIAN_LOCALE} />);
    await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(1));
    openLanguages();
    fireEvent.click(await screen.findByRole("option", { name: /English/ }));

    expect(readMockNavigationCalls()).toEqual({ push: [], replace: ["/pages"] });
  });
});
