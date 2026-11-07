import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SECTION_SCHEMAS } from "@repo/contracts/cms/pages";
import { ConflictError, NotFoundError, ValidationError } from "@repo/errors";

import { api } from "@app/lib/api";
import { adminKeys } from "@app/lib/api/keys";
import { render } from "@app/test/render";

import {
  ENGLISH,
  makeLanguage,
  makePendingRequest,
  POLISH,
  UKRAINIAN,
} from "../../languages.fixtures";

import { LanguagesListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const CATALOG = [ENGLISH, UKRAINIAN, POLISH];
const MANY_SECTIONS = 3;
const EMPTY_MESSAGE = "The site is in English only. Add a language to start translating it.";
const rowOf = (name: string): HTMLElement => screen.getByRole("row", { name: new RegExp(name) });
const click = (name: string): void => {
  fireEvent.click(screen.getByRole("button", { name }));
};
const expectFocusableUnavailable = (control: HTMLElement): void => {
  expect(control).toHaveAttribute("aria-disabled", "true");
  expect(control).not.toHaveAttribute("disabled");
  control.focus();
  expect(control).toHaveFocus();
};

beforeEach(() => {
  vi.spyOn(api.locales, "update").mockResolvedValue(undefined);
  vi.spyOn(api.locales, "reorder").mockResolvedValue([ENGLISH, POLISH, UKRAINIAN]);
  vi.spyOn(api.locales, "delete").mockResolvedValue(undefined);
  vi.spyOn(toast, "success").mockImplementation(() => "toast");
  vi.spyOn(toast, "error").mockImplementation(() => "toast");
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("LanguagesListSection", () => {
  it("marks English Default with an editable name and no switch, move, progress or delete controls", () => {
    render(<LanguagesListSection locales={CATALOG} />);

    const english = within(rowOf(ENGLISH.name));

    expect(english.getByText("Default")).toBeInTheDocument();
    expect(english.getByRole("link", { name: ENGLISH.name })).toHaveAttribute(
      "href",
      "/languages/en",
    );
    expect(english.queryByRole("checkbox")).toBeNull();
    expect(english.queryByRole("switch")).toBeNull();
    expect(english.queryByRole("button")).toBeNull();
    expect(english.queryByRole("progressbar")).toBeNull();
  });

  it("renders row-specific controls, real paths and a contract-derived translation count", () => {
    render(<LanguagesListSection locales={CATALOG} />);

    expect(within(rowOf(ENGLISH.name)).getByText("/")).toBeInTheDocument();
    expect(within(rowOf(UKRAINIAN.name)).getByText("/uk")).toBeInTheDocument();
    expect(
      within(rowOf(UKRAINIAN.name)).getByText(
        `0 of ${Object.keys(SECTION_SCHEMAS).length} translated`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(`Enable ${UKRAINIAN.name}`)).not.toBeChecked();
    expect(
      screen.getByRole("progressbar", { name: `${UKRAINIAN.name} translation progress` }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByRole("button", { name: `Delete ${UKRAINIAN.name}` })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create Language" })).toHaveAttribute(
      "href",
      "/languages/create",
    );
  });

  it("keeps edge moves focusable and sends no request when they are clicked", async () => {
    render(<LanguagesListSection locales={CATALOG} />);

    for (const name of [`Move ${UKRAINIAN.name} up`, `Move ${POLISH.name} down`]) {
      const control = screen.getByRole("button", { name });

      expectFocusableUnavailable(control);
      await act(async () => {
        fireEvent.click(control);
      });
      expect(control).toHaveFocus();
    }

    expect(api.locales.reorder).not.toHaveBeenCalled();
  });

  it("writes the swapped non-default order and toasts on success", async () => {
    render(<LanguagesListSection locales={CATALOG} />);
    click(`Move ${POLISH.name} up`);

    await waitFor(() =>
      expect(api.locales.reorder).toHaveBeenCalledExactlyOnceWith({
        orderedCodes: [POLISH.code, UKRAINIAN.code],
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Languages reordered"));
  });

  it("keeps every move focusable and guarded during a reorder", async () => {
    const pending = makePendingRequest();

    vi.mocked(api.locales.reorder).mockImplementationOnce(async () => {
      await pending.promise;

      return CATALOG;
    });
    render(<LanguagesListSection locales={CATALOG} />);

    const focused = screen.getByRole("button", { name: `Move ${POLISH.name} up` });

    focused.focus();
    fireEvent.click(focused);
    await waitFor(() => expect(focused).toHaveAttribute("aria-disabled", "true"));
    expect(focused).toHaveFocus();

    for (const control of screen.getAllByRole("button", { name: /^Move / })) {
      expectFocusableUnavailable(control);
      await act(async () => {
        fireEvent.click(control);
      });
    }

    expect(api.locales.reorder).toHaveBeenCalledTimes(1);
    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    await waitFor(() => expect(focused).toHaveAttribute("aria-disabled", "false"));
    expect(api.locales.reorder).toHaveBeenCalledTimes(1);
  });

  it("toggles only the selected row and toasts on success", async () => {
    render(<LanguagesListSection locales={CATALOG} />);
    fireEvent.click(screen.getByLabelText(`Enable ${UKRAINIAN.name}`));

    await waitFor(() =>
      expect(api.locales.update).toHaveBeenCalledExactlyOnceWith(UKRAINIAN.code, {
        isEnabled: true,
      }),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Language status updated"));
  });

  it("keeps the pending switch focusable and guarded while other rows remain available", async () => {
    const pending = makePendingRequest();

    vi.mocked(api.locales.update).mockReturnValueOnce(pending.promise);
    render(<LanguagesListSection locales={CATALOG} />);

    const control = screen.getByLabelText(`Enable ${UKRAINIAN.name}`);

    control.focus();
    fireEvent.click(control);
    await waitFor(() => expect(control).toHaveAttribute("aria-disabled", "true"));
    expectFocusableUnavailable(control);
    await act(async () => {
      fireEvent.click(control);
    });
    expect(api.locales.update).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(`Enable ${POLISH.name}`)).toHaveAttribute(
      "aria-disabled",
      "false",
    );
    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    await waitFor(() => expect(control).toHaveAttribute("aria-disabled", "false"));
    expect(api.locales.update).toHaveBeenCalledTimes(1);
  });

  it("keeps the first row guarded after another row finishes its overlapping toggle", async () => {
    const ukrainian = makePendingRequest();
    const polish = makePendingRequest();

    vi.mocked(api.locales.update)
      .mockReturnValueOnce(ukrainian.promise)
      .mockReturnValueOnce(polish.promise);
    render(<LanguagesListSection locales={CATALOG} />);

    const first = screen.getByLabelText(`Enable ${UKRAINIAN.name}`);
    const second = screen.getByLabelText(`Enable ${POLISH.name}`);

    await act(async () => {
      fireEvent.click(first);
    });
    await waitFor(() => expect(first).toHaveAttribute("aria-disabled", "true"));
    await act(async () => {
      fireEvent.click(second);
    });
    await waitFor(() => expect(second).toHaveAttribute("aria-disabled", "true"));
    await act(async () => {
      polish.resolve();
      await polish.promise;
    });
    await waitFor(() => expect(second).toHaveAttribute("aria-disabled", "false"));
    expectFocusableUnavailable(first);
    await act(async () => {
      fireEvent.click(first);
    });
    expect(api.locales.update).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.locales.update).mock.calls).toEqual([
      [UKRAINIAN.code, { isEnabled: true }],
      [POLISH.code, { isEnabled: true }],
    ]);
    await act(async () => {
      ukrainian.resolve();
      await ukrainian.promise;
    });
    await waitFor(() => expect(first).toHaveAttribute("aria-disabled", "false"));
    expect(api.locales.update).toHaveBeenCalledTimes(2);
  });

  it.each([true, false])(
    "shows the content refusal for an enabled state of %s inside the modal",
    async (isEnabled) => {
      vi.mocked(api.locales.delete).mockRejectedValueOnce(
        new ConflictError("Never show the server wording", {
          code: "uk",
          translatedSectionCount: MANY_SECTIONS,
        }),
      );
      render(<LanguagesListSection locales={[ENGLISH, makeLanguage({ isEnabled })]} />);
      click(`Delete ${UKRAINIAN.name}`);
      click("Delete");

      const advice = isEnabled
        ? "Disable it instead to hide it from the site."
        : "It stays hidden from the site while it is disabled.";

      expect(
        await screen.findByText(
          `${UKRAINIAN.name} still has content in ${MANY_SECTIONS} sections, so it cannot be deleted. ${advice}`,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText("Never show the server wording")).toBeNull();
      expect(toast.error).not.toHaveBeenCalled();
    },
  );

  it("shows unmapped delete failures and clears them before another modal opens", async () => {
    vi.mocked(api.locales.delete).mockRejectedValueOnce(
      new NotFoundError("Language no longer exists"),
    );
    render(<LanguagesListSection locales={CATALOG} />);
    click(`Delete ${UKRAINIAN.name}`);
    click("Delete");

    expect(await screen.findByText("Language no longer exists")).toBeInTheDocument();
    click("Cancel");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    click(`Delete ${POLISH.name}`);
    expect(screen.queryByText("Language no longer exists")).toBeNull();
  });

  it("deletes after confirmation and toasts on success", async () => {
    render(<LanguagesListSection locales={CATALOG} />);
    click(`Delete ${POLISH.name}`);
    expect(api.locales.delete).not.toHaveBeenCalled();
    click("Delete");

    await waitFor(() => expect(api.locales.delete).toHaveBeenCalledWith(POLISH.code));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Language deleted successfully"),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("clears a removed row's delete failure before confirming another language", async () => {
    vi.mocked(api.locales.delete).mockRejectedValueOnce(
      new NotFoundError("Previous language no longer exists"),
    );

    const { rerender } = render(<LanguagesListSection locales={CATALOG} />);

    click(`Delete ${UKRAINIAN.name}`);
    click("Delete");
    expect(await screen.findByText("Previous language no longer exists")).toBeInTheDocument();
    rerender(<LanguagesListSection locales={[ENGLISH, POLISH]} />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await act(async () => {
      click(`Delete ${POLISH.name}`);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("Previous language no longer exists")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(api.locales.delete).toHaveBeenCalledExactlyOnceWith(UKRAINIAN.code);
  });

  it("explains a stale reorder and invalidates the list instead of showing the server message", async () => {
    const invalidate = vi.spyOn(QueryClient.prototype, "invalidateQueries");

    vi.mocked(api.locales.reorder).mockRejectedValueOnce(new ConflictError("Server stale wording"));
    render(<LanguagesListSection locales={CATALOG} />);
    click(`Move ${POLISH.name} up`);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "The language list changed in the meantime and was reloaded. Try the move again.",
      ),
    );
    expect(toast.error).not.toHaveBeenCalledWith("Server stale wording");
    expect(invalidate).toHaveBeenCalledWith({ queryKey: adminKeys.locales.list() });
  });

  it("uses the shared validation notifier for other reorder failures", async () => {
    vi.mocked(api.locales.reorder).mockRejectedValueOnce(
      new ValidationError("Rejected", {
        issues: [{ path: "orderedCodes", message: "Invalid order" }],
      }),
    );
    render(<LanguagesListSection locales={CATALOG} />);
    click(`Move ${POLISH.name} up`);

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("orderedCodes: Invalid order"));
  });

  it("invites the first language only while English is alone", () => {
    const { rerender } = render(<LanguagesListSection locales={[ENGLISH]} />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Language" })).toBeInTheDocument();
    rerender(<LanguagesListSection locales={CATALOG} />);
    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });
});
