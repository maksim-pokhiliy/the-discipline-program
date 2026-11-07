import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConflictError } from "@repo/errors";

import { api } from "@app/lib/api";
import { render } from "@app/test/render";

import { ENGLISH, makePending, UKRAINIAN } from "../../languages.fixtures";

import { LanguagesListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LanguagesListSection pending deletion", () => {
  it("keeps the dialog open through a close click and displays a late content refusal", async () => {
    const request = makePending<void>();

    vi.spyOn(api.locales, "delete").mockImplementationOnce(async () => {
      await request.promise;
      throw new ConflictError("Server wording", { translatedSectionCount: 1 });
    });
    render(<LanguagesListSection locales={[ENGLISH, UKRAINIAN]} />);
    fireEvent.click(screen.getByRole("button", { name: `Delete ${UKRAINIAN.name}` }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.locales.delete).toHaveBeenCalledTimes(1));

    const dialog = screen.getByRole("dialog");

    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled(),
    );
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    });
    expect(dialog).toBeInTheDocument();
    await act(async () => {
      request.resolve();
      await request.promise;
    });
    expect(
      await within(dialog).findByText(
        `${UKRAINIAN.name} still has content in 1 section, so it cannot be deleted. It stays hidden from the site while it is disabled.`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Server wording")).toBeNull();
  });
});
