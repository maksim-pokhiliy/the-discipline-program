import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@app/lib/api";
import { resetMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import { LOCALE_CATALOG, UKRAINIAN_LOCALE } from "../../locale.fixtures";

import { LanguageBar } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

const styleRules = (rules: CSSRuleList): CSSStyleRule[] =>
  Array.from(rules).flatMap((rule) => {
    if (rule instanceof CSSStyleRule) {
      return [rule];
    }

    if (rule instanceof CSSMediaRule) {
      return styleRules(rule.cssRules);
    }

    return [];
  });

beforeEach(() => {
  resetMockNavigation();
  vi.spyOn(api.locales, "list").mockResolvedValue(LOCALE_CATALOG);
});

afterEach(() => {
  resetMockNavigation();
  vi.restoreAllMocks();
});

describe("LanguageBar", () => {
  it("puts a full-width banner above the switch at every declared breakpoint", async () => {
    render(<LanguageBar locale={UKRAINIAN_LOCALE} />);
    await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(1));

    const banner = screen.getByRole("alert");
    const control = screen
      .getByRole("combobox", { name: "Language" })
      .closest(".MuiFormControl-root");
    const bar = banner.parentElement;

    expect(bar).not.toBeNull();
    expect(bar?.children).toHaveLength(2);
    expect(bar?.firstElementChild).toBe(banner);
    expect(bar?.lastElementChild).toBe(control);
    expect(banner).toHaveStyle({ width: "100%" });

    const directions = Array.from(document.styleSheets)
      .flatMap((sheet) => styleRules(sheet.cssRules))
      .filter((rule) => rule.style.getPropertyValue("flex-direction"))
      .filter((rule) => bar?.matches(rule.selectorText))
      .map((rule) => rule.style.getPropertyValue("flex-direction"));

    expect(directions.length).toBeGreaterThan(0);
    expect(new Set(directions)).toEqual(new Set(["column"]));
  });
});
