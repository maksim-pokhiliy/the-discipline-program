import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import { PageSlug, type AdminPageDetails } from "@repo/contracts/cms/pages";
import { QueryProvider, STALE_TIMES } from "@repo/query";

import type * as Api from "@app/lib/api";
import { adminKeys } from "@app/lib/api/keys";
import { clickButton, typeInto } from "@app/test/interactions";
import { resetMockNavigation, setMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import { makeDeferred } from "../../deferred.fixtures";
import { ENGLISH_LOCALE, LOCALE_CATALOG, UKRAINIAN_LOCALE } from "../../locale.fixtures";
import { makePageListItem } from "../../pages.fixtures";
import { PagesListView } from "../pages-list-view";

import { makeLocaleSeoPage, makeLocaleTermsPage } from "./page-locale.fixtures";

import { PagesEditView } from "./index";

const endpoints = vi.hoisted(() => ({
  getPageBySlug: vi.fn<typeof Api.api.pages.getPageBySlug>(),
  getPages: vi.fn<typeof Api.api.pages.getPages>(),
  updateSection: vi.fn<typeof Api.api.pages.updateSection>(),
  listLocales: vi.fn<typeof Api.api.locales.list>(),
}));
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      pages: { ...actual.api.pages, ...endpoints },
      locales: { ...actual.api.locales, list: endpoints.listLocales },
    },
  };
});
vi.mock("sonner", () => ({ toast: notifications }));
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

beforeEach(() => {
  vi.clearAllMocks();
  endpoints.getPageBySlug
    .mockReset()
    .mockImplementation(async (_slug, locale) => makeLocaleSeoPage(locale));
  endpoints.getPages.mockReset().mockResolvedValue([makePageListItem(PageSlug.HOME)]);
  endpoints.updateSection.mockReset().mockResolvedValue(undefined);
  endpoints.listLocales.mockReset().mockResolvedValue(LOCALE_CATALOG);
  resetMockNavigation();
  setMockNavigation({ pathname: "/pages/home", search: "locale=uk" });
});

const prepareSaveRace = (locale: LocaleCode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: STALE_TIMES.THIRTY_SECONDS } },
  });
  const patch = makeDeferred<void>();
  const beforeWrite = makeDeferred<AdminPageDetails>();
  const refresh = makeDeferred<AdminPageDetails>();
  const queryKey = adminKeys.pages.detail(PageSlug.HOME, locale);
  const initial = makeLocaleSeoPage(locale);
  const saved = makeLocaleSeoPage(locale, "Saved title");

  client.setQueryData(queryKey, initial);
  endpoints.updateSection.mockReturnValueOnce(patch.promise);
  endpoints.getPageBySlug
    .mockReturnValueOnce(beforeWrite.promise)
    .mockReturnValueOnce(refresh.promise);
  setMockNavigation({ search: locale === ENGLISH_LOCALE.code ? "" : `locale=${locale}` });

  return { client, patch, beforeWrite, refresh, queryKey, initial, saved };
};

const expectLockedSeoEditor = (title: string) => {
  expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
  screen.getAllByRole("textbox").forEach((field) => expect(field).toBeDisabled());
  expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  expect(notifications.success).not.toHaveBeenCalled();
};

describe("page editor in a language with real query hooks", () => {
  it.each([ENGLISH_LOCALE, UKRAINIAN_LOCALE])(
    "replaces a pre-write read on returning to the $name editor during a save",
    async ({ code }) => {
      const { client, patch, beforeWrite, refresh, queryKey, initial, saved } =
        prepareSaveRace(code);
      const editor = (
        <QueryClientProvider client={client}>
          <PagesEditView slug={PageSlug.HOME} />
        </QueryClientProvider>
      );
      const { rerender, unmount } = render(editor);

      await screen.findByLabelText("Search Result Title");
      typeInto("Search Result Title", "Saved title");
      clickButton("Update Section");
      await waitFor(() => expect(endpoints.updateSection).toHaveBeenCalledTimes(1));
      expectLockedSeoEditor("Saved title");
      rerender(<QueryClientProvider client={client}>Left editor</QueryClientProvider>);
      await act(async () => {
        await client.invalidateQueries({ queryKey, exact: true, refetchType: "none" });
      });
      rerender(editor);
      await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(1));
      expectLockedSeoEditor(`${code} title`);
      await act(async () => patch.resolve());
      await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(2));
      expectLockedSeoEditor(`${code} title`);
      await act(async () => refresh.resolve(saved));
      await waitFor(() => expect(screen.getByLabelText("Search Result Title")).toBeEnabled());
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("Saved title");
      expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Section updated successfully");
      await act(async () => beforeWrite.resolve(initial));
      expect(client.getQueryData(queryKey)).toEqual(saved);
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("Saved title");
      expect(endpoints.getPageBySlug.mock.calls).toEqual([
        [PageSlug.HOME, code],
        [PageSlug.HOME, code],
      ]);
      unmount();
      client.clear();
    },
  );

  it("reads and saves the Ukrainian page with locale uk and leaves the English page as it was", async () => {
    setMockNavigation({ search: "" });
    const { rerender } = render(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );

    expect(await screen.findByLabelText("Search Result Title")).toHaveValue("en title");
    setMockNavigation({ search: "locale=uk" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("uk title"),
    );
    expect(endpoints.getPageBySlug).toHaveBeenCalledWith(PageSlug.HOME, "uk");
    typeInto("Search Result Title", "Saved Ukrainian title");
    clickButton("Update Section");

    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.HOME, {
        section: "home:seo",
        data: { title: "Saved Ukrainian title", description: "uk description" },
        locale: "uk",
      }),
    );
    await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(1));
    setMockNavigation({ search: "" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("en title"),
    );
    expect(endpoints.getPageBySlug.mock.calls.filter(([, locale]) => locale === "en")).toHaveLength(
      1,
    );
  });

  it("keeps the page locked when the coach leaves and returns during a save", async () => {
    const patch = makeDeferred<void>();
    const refresh = makeDeferred<AdminPageDetails>();

    endpoints.getPageBySlug.mockImplementation(async (slug, locale) =>
      slug === PageSlug.OFFER ? makeLocaleTermsPage(locale) : makeLocaleSeoPage(locale),
    );
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    const { rerender } = render(
      <QueryProvider>
        <PagesEditView slug={PageSlug.OFFER} />
      </QueryProvider>,
    );

    await screen.findByLabelText("Section Title");
    typeInto("Section Title", "Saved Ukrainian terms");
    clickButton("Update Section");
    await waitFor(() => expect(screen.getByLabelText("Section Title")).toBeDisabled());
    rerender(
      <QueryProvider>
        <div>Left editor</div>
      </QueryProvider>,
    );
    setMockNavigation({ search: "" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.OFFER} />
      </QueryProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText("Section Title")).toHaveValue("en terms"));
    expect(screen.getByLabelText("Section Title")).toBeEnabled();
    setMockNavigation({ search: "locale=uk" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );
    await screen.findByLabelText("Search Result Title");
    expect(screen.getByLabelText("Search Result Title")).toBeEnabled();
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.OFFER} />
      </QueryProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText("Section Title")).toBeDisabled());
    expect(screen.getByLabelText("Section Title")).toHaveValue("uk terms");
    screen.getAllByRole("textbox").forEach((field) => expect(field).toBeDisabled());
    screen
      .getAllByRole("button", {
        name: /Add Terms Block|Move up|Move down|Remove item|Update Section|Clear Translation/,
      })
      .forEach((button) => expect(button).toBeDisabled());
    endpoints.getPageBySlug.mockReturnValueOnce(refresh.promise);
    await act(async () => patch.resolve());
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(4));
    expect(screen.getByLabelText("Section Title")).toBeDisabled();
    expect(notifications.success).not.toHaveBeenCalled();
    await act(async () => refresh.resolve(makeLocaleTermsPage("uk", "Saved Ukrainian terms")));

    await waitFor(() => expect(screen.getByLabelText("Section Title")).toBeEnabled());
    expect(screen.getByLabelText("Section Title")).toHaveValue("Saved Ukrainian terms");
    expect(screen.getByRole("button", { name: "Add Terms Block" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("refreshes the Pages list and the Languages counts after a Ukrainian save", async () => {
    const initial = { ...makePageListItem(PageSlug.HOME), translatedSectionCount: 0 };

    endpoints.getPages
      .mockResolvedValueOnce([initial])
      .mockResolvedValue([{ ...initial, translatedSectionCount: 1 }]);
    const { rerender } = render(
      <QueryProvider>
        <PagesListView />
      </QueryProvider>,
    );

    await screen.findByText("0 of 6 translated");
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
        <PagesListView />
      </QueryProvider>,
    );
    await screen.findByLabelText("Search Result Title");
    typeInto("Search Result Title", "New Ukrainian title");
    clickButton("Update Section");

    await screen.findByText("1 of 6 translated");
    expect(endpoints.getPages).toHaveBeenCalledTimes(2);
    expect(endpoints.getPages).toHaveBeenLastCalledWith("uk");
    await waitFor(() => expect(endpoints.listLocales).toHaveBeenCalledTimes(2));
  });

  it("marks the other languages' pages stale after an English save", async () => {
    const { rerender } = render(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );

    await screen.findByLabelText("Search Result Title");
    setMockNavigation({ search: "locale=de" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("de title"),
    );
    setMockNavigation({ search: "" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
        <PagesListView />
      </QueryProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("en title"),
    );
    await screen.findByRole("columnheader", { name: "Page Name" });
    typeInto("Search Result Title", "Changed English title");
    clickButton("Update Section");
    await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(1));
    expect(endpoints.getPages).toHaveBeenCalledTimes(1);
    expect(endpoints.listLocales).toHaveBeenCalledTimes(1);
    expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(4);
    setMockNavigation({ search: "locale=uk" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(5));
    setMockNavigation({ search: "locale=de" });
    rerender(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(6));
    expect(endpoints.getPageBySlug.mock.calls.filter(([, locale]) => locale === "uk")).toHaveLength(
      2,
    );
    expect(endpoints.getPageBySlug.mock.calls.filter(([, locale]) => locale === "de")).toHaveLength(
      2,
    );
  });

  it("shows the not-found page for an unknown language", async () => {
    setMockNavigation({ search: "locale=xx" });
    render(
      <QueryProvider>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(endpoints.getPageBySlug).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Update Section" })).not.toBeInTheDocument();
  });
});
