import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clickButton, typeInto } from "@app/test/interactions";

import { makeSectionRow, makeSeoData, renderSectionEditor } from "../../pages.fixtures";

const LONG_TITLE_LENGTH = 75;

describe("SeoSectionForm", () => {
  it("shows the stored lengths against the recommended 60 and 160", () => {
    const data = makeSeoData();

    renderSectionEditor(makeSectionRow("home:seo", data));

    expect(screen.getByLabelText("Search Result Title")).toHaveValue(data.title);
    expect(screen.getByLabelText("Search Result Description")).toHaveValue(data.description);
    expect(screen.getByText(`${data.title.length} / 60`)).toBeInTheDocument();
    expect(screen.getByText(`${data.description.length} / 160`)).toBeInTheDocument();
  });

  it("counts from zero on an empty section", () => {
    renderSectionEditor(makeSectionRow("home:seo", {}));

    expect(screen.getByText("0 / 60")).toBeInTheDocument();
    expect(screen.getByText("0 / 160")).toBeInTheDocument();
  });

  it("updates each counter as its own field is typed", () => {
    const data = makeSeoData();
    const title = "Edited title";
    const description = "Edited fixture description";

    renderSectionEditor(makeSectionRow("home:seo", data));

    typeInto("Search Result Title", title);
    expect(screen.getByText(`${title.length} / 60`)).toBeInTheDocument();
    expect(screen.getByText(`${data.description.length} / 160`)).toBeInTheDocument();

    typeInto("Search Result Description", description);
    expect(screen.getByText(`${title.length} / 60`)).toBeInTheDocument();
    expect(screen.getByText(`${description.length} / 160`)).toBeInTheDocument();
  });

  it("lets a title run past the recommended length without an error and saves it", async () => {
    const onSave = vi.fn();
    const data = makeSeoData();
    const title = "x".repeat(LONG_TITLE_LENGTH);

    renderSectionEditor(makeSectionRow("home:seo", data), onSave);

    typeInto("Search Result Title", title);

    expect(screen.getByText("75 / 60")).toBeInTheDocument();
    expect(screen.getByLabelText("Search Result Title")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    clickButton("Update Section");

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        section: "home:seo",
        data: { ...data, title },
      }),
    );
  });
});
