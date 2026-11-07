import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

import { api } from "@app/lib/api";
import { adminKeys } from "@app/lib/api/keys";
import { render } from "@app/test/render";

import { ENGLISH, makeLanguage, makePending, POLISH, UKRAINIAN } from "../../languages.fixtures";

import { LanguagesListView } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const CATALOG = [ENGLISH, UKRAINIAN, POLISH];
const REORDERED = [ENGLISH, POLISH, UKRAINIAN];
const QUERY_KEY = adminKeys.locales.list();
const clients: QueryClient[] = [];

const renderCatalog = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <LanguagesListView />
    </QueryClientProvider>,
  );

  return client;
};

const click = async (name: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
};

beforeEach(() => {
  vi.spyOn(api.locales, "list").mockResolvedValue(CATALOG);
  vi.spyOn(api.locales, "update").mockResolvedValue(undefined);
  vi.spyOn(api.locales, "delete").mockResolvedValue(undefined);
  vi.spyOn(api.locales, "reorder").mockResolvedValue(REORDERED);
  vi.spyOn(toast, "success").mockImplementation(() => "toast");
  vi.spyOn(toast, "error").mockImplementation(() => "toast");
});
afterEach(() => {
  cleanup();

  for (const client of clients) {
    client.clear();
  }

  clients.length = 0;
  vi.restoreAllMocks();
});

describe("LanguagesListView reconciliation", () => {
  it("reloads a stale catalog after a conflict and retries the move with the current full set", async () => {
    const german = makeLanguage({ code: "de", name: "Deutsch", sortOrder: CATALOG.length });
    const current = [...CATALOG, german];
    const reordered = [...REORDERED, german];

    vi.mocked(api.locales.list)
      .mockResolvedValueOnce(CATALOG)
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(reordered);
    vi.mocked(api.locales.reorder)
      .mockRejectedValueOnce(new ConflictError("Server stale wording"))
      .mockResolvedValueOnce(reordered);

    const client = renderCatalog();

    await screen.findByLabelText(`Enable ${POLISH.name}`);
    await click(`Move ${POLISH.name} up`);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(
        "The language list changed in the meantime and was reloaded. Try the move again.",
      ),
    );
    await screen.findByRole("link", { name: german.name });
    expect(api.locales.list).toHaveBeenCalledTimes(2);
    expect(client.getQueryData(QUERY_KEY)).toEqual(current);
    expect(toast.success).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: `Move ${POLISH.name} up` })).toHaveAttribute(
        "aria-disabled",
        "false",
      ),
    );
    await click(`Move ${POLISH.name} up`);
    await waitFor(() => expect(client.getQueryData(QUERY_KEY)).toEqual(reordered));
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(vi.mocked(api.locales.reorder).mock.calls).toEqual([
      [{ orderedCodes: [POLISH.code, UKRAINIAN.code] }],
      [{ orderedCodes: [POLISH.code, UKRAINIAN.code, german.code] }],
    ]);
    expect(toast.error).not.toHaveBeenCalledWith("Server stale wording");
    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Languages reordered");
  });

  it.each(["toggle", "delete"])(
    "reconciles a delayed reorder snapshot after a newer %s refetch",
    async (operation) => {
      const reorder = makePending<AdminLocaleListItem[]>();
      const reconciliation = makePending<AdminLocaleListItem[]>();
      const current =
        operation === "toggle"
          ? [ENGLISH, POLISH, { ...UKRAINIAN, isEnabled: true }]
          : [ENGLISH, POLISH];

      vi.mocked(api.locales.list)
        .mockResolvedValueOnce(CATALOG)
        .mockResolvedValueOnce(current)
        .mockReturnValueOnce(reconciliation.promise);
      vi.mocked(api.locales.reorder).mockReturnValueOnce(reorder.promise);

      const client = renderCatalog();

      await screen.findByLabelText(`Enable ${UKRAINIAN.name}`);
      await click(`Move ${POLISH.name} up`);
      await waitFor(() => expect(api.locales.reorder).toHaveBeenCalledTimes(1));

      if (operation === "toggle") {
        await act(async () => {
          fireEvent.click(screen.getByLabelText(`Enable ${UKRAINIAN.name}`));
        });
      } else {
        await click(`Delete ${UKRAINIAN.name}`);
        await click("Delete");
      }

      await waitFor(() => expect(client.getQueryData(QUERY_KEY)).toEqual(current));
      expect(api.locales.list).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await act(async () => {
        reorder.resolve(REORDERED);
        await reorder.promise;
      });
      await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(3));
      expect(client.getQueryData(QUERY_KEY)).toEqual(REORDERED);

      for (const control of screen.getAllByRole("button", { name: /^Move / })) {
        expect(control).toHaveAttribute("aria-disabled", "true");
      }

      expect(client.isMutating()).toBe(1);
      await act(async () => {
        reconciliation.resolve(current);
        await reconciliation.promise;
      });
      await waitFor(() => expect(client.isMutating()).toBe(0));
      expect(client.getQueryData(QUERY_KEY)).toEqual(current);

      if (operation === "toggle") {
        expect(screen.getByLabelText(`Enable ${UKRAINIAN.name}`)).toBeChecked();
      } else {
        expect(screen.queryByLabelText(`Enable ${UKRAINIAN.name}`)).toBeNull();
      }
    },
  );

  it("suppresses an older in-flight GET that ignores cancellation and completes after reconciliation", async () => {
    const older = makePending<AdminLocaleListItem[]>();
    const reorder = makePending<AdminLocaleListItem[]>();
    const reconciliation = makePending<AdminLocaleListItem[]>();
    const current = [ENGLISH, POLISH, { ...UKRAINIAN, isEnabled: true }];

    vi.mocked(api.locales.list)
      .mockResolvedValueOnce(CATALOG)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(reconciliation.promise);
    vi.mocked(api.locales.reorder).mockReturnValueOnce(reorder.promise);

    const client = renderCatalog();

    await screen.findByLabelText(`Enable ${UKRAINIAN.name}`);

    let olderFetch: Promise<void> | undefined;

    await act(async () => {
      olderFetch = client.refetchQueries({ queryKey: QUERY_KEY });
    });
    expect(api.locales.list).toHaveBeenCalledTimes(2);
    await click(`Move ${POLISH.name} up`);
    await waitFor(() => expect(api.locales.reorder).toHaveBeenCalledTimes(1));
    await act(async () => {
      reorder.resolve(REORDERED);
      await reorder.promise;
    });
    await waitFor(() => expect(api.locales.list).toHaveBeenCalledTimes(3));
    expect(client.getQueryData(QUERY_KEY)).toEqual(REORDERED);
    expect(client.isMutating()).toBe(1);
    await act(async () => {
      reconciliation.resolve(current);
      await reconciliation.promise;
    });
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(client.getQueryData(QUERY_KEY)).toEqual(current);
    await act(async () => {
      older.resolve(CATALOG);
      await older.promise;
      await olderFetch;
    });
    expect(client.getQueryData(QUERY_KEY)).toEqual(current);
    expect(screen.getByLabelText(`Enable ${UKRAINIAN.name}`)).toBeChecked();
    expect(api.locales.list).toHaveBeenCalledTimes(3);
  });
});
