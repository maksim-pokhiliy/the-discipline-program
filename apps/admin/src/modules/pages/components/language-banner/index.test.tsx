import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { render } from "@app/test/render";

import { ENGLISH_LOCALE, HIDDEN_LOCALE, UKRAINIAN_LOCALE } from "../../locale.fixtures";

import { LanguageBanner } from "./index";

describe("LanguageBanner", () => {
  it("names the language being edited", () => {
    render(<LanguageBanner locale={UKRAINIAN_LOCALE} />);

    expect(screen.getByText(`Editing ${UKRAINIAN_LOCALE.name}`)).toBeInTheDocument();
    expect(screen.queryByText("Hidden from site")).toBeNull();
  });

  it("says English is the default and every other language falls back to it", () => {
    render(<LanguageBanner locale={ENGLISH_LOCALE} />);

    expect(
      screen.getByText(
        "English is the default language: every other language falls back to it, section by section.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/saved as a draft/)).toBeNull();
  });

  it("says a disabled language is hidden from the site", () => {
    render(<LanguageBanner locale={HIDDEN_LOCALE} />);

    expect(screen.getByText("Hidden from site")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${HIDDEN_LOCALE.name} is hidden from the site until you enable it on the Languages page.`,
      ),
    ).toBeInTheDocument();
  });

  it("states the draft rule outside English without promising references in list forms", () => {
    render(<LanguageBanner locale={UKRAINIAN_LOCALE} />);

    expect(
      screen.getByText("Links, images and list rows always come from English."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `A section goes live in ${UKRAINIAN_LOCALE.name} once every English text in it has a translation. Until then it is saved as a draft that the site does not show.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Each field shows its English text beside it/)).toBeNull();
  });
});
