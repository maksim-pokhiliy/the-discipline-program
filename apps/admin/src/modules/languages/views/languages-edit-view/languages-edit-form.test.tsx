import { screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@app/lib/api";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { ENGLISH, UKRAINIAN } from "../../languages.fixtures";

import { LanguagesEditForm } from "./languages-edit-form";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

beforeEach(() => {
  vi.spyOn(api.locales, "update").mockResolvedValue(undefined);
  vi.spyOn(toast, "success").mockImplementation(() => "toast");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("LanguagesEditForm", () => {
  it.each([ENGLISH, UKRAINIAN])("shows the $code code read-only", (language) => {
    render(<LanguagesEditForm language={language} />);

    expect(screen.getByLabelText("Code")).toHaveValue(language.code);
    expect(screen.getByLabelText("Code")).toHaveAttribute("readonly");
    expect(screen.getByText("The code cannot be changed")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue(language.name);
  });

  it("submits the name alone and toasts on success", async () => {
    render(<LanguagesEditForm language={UKRAINIAN} />);
    typeInto("Name", "Ukrainian");
    clickButton("Save changes");

    await waitFor(() =>
      expect(api.locales.update).toHaveBeenCalledExactlyOnceWith(UKRAINIAN.code, {
        name: "Ukrainian",
      }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Language updated successfully"),
    );
  });
});
