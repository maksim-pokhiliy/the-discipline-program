import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

import { api } from "@app/lib/api";
import { render } from "@app/test/render";

import { ENGLISH, makePending, POLISH, UKRAINIAN } from "../../languages.fixtures";

import { LanguagesListView } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const CATALOG = [ENGLISH, UKRAINIAN, POLISH];
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  vi.spyOn(api.locales, "list").mockResolvedValueOnce(CATALOG);
  vi.spyOn(api.locales, "reorder").mockRejectedValue(new ConflictError("Stale catalog"));
  vi.spyOn(api.locales, "update").mockResolvedValue(undefined);
  vi.spyOn(toast, "success").mockImplementation(() => "toast");
  vi.spyOn(toast, "error").mockImplementation(() => "toast");
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

const renderCatalog = (): void => {
  render(
    <QueryClientProvider client={client}>
      <LanguagesListView />
    </QueryClientProvider>,
  );
};

const click = async (control: HTMLElement): Promise<void> => {
  await act(async () => {
    fireEvent.click(control);
  });
};

describe("LanguagesListView pending reloads", () => {
  it("guards every move after a conflict until the catalog reload completes", async () => {
    const reload = makePending<AdminLocaleListItem[]>();

    vi.mocked(api.locales.list).mockReturnValueOnce(reload.promise);
    renderCatalog();
    await screen.findByLabelText(`Enable ${POLISH.name}`);

    const control = screen.getByRole("button", { name: `Move ${POLISH.name} up` });

    await click(control);
    await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(client.isMutating()).toBe(1);

    for (const move of screen.getAllByRole("button", { name: /^Move / })) {
      expect(move).toHaveAttribute("aria-disabled", "true");
      expect(move).not.toHaveAttribute("disabled");
      await click(move);
    }

    expect(api.locales.reorder).toHaveBeenCalledTimes(1);
    await act(async () => {
      reload.resolve(CATALOG);
      await reload.promise;
    });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(control).toHaveAttribute("aria-disabled", "false");
  });

  it("guards a successful toggle until its catalog reload completes", async () => {
    const reload = makePending<AdminLocaleListItem[]>();

    vi.mocked(api.locales.list).mockReturnValueOnce(reload.promise);
    renderCatalog();

    const control = await screen.findByLabelText(`Enable ${UKRAINIAN.name}`);

    await click(control);
    await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Language status updated"));
    expect(client.isMutating()).toBe(1);
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control).not.toHaveAttribute("disabled");
    expect(control).not.toBeChecked();
    await click(control);
    expect(api.locales.update).toHaveBeenCalledTimes(1);
    await act(async () => {
      reload.resolve([ENGLISH, { ...UKRAINIAN, isEnabled: true }, POLISH]);
      await reload.promise;
    });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(control).toHaveAttribute("aria-disabled", "false");
    expect(control).toBeChecked();
  });
});
