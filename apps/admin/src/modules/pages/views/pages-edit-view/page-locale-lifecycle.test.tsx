import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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

import {
  makeClearedLocaleSeoPage,
  makeEnglishNewerSeoPage,
  makeLocaleSeoAndHeroPage,
  makeLocaleSeoPage,
  makeLocaleTermsPage,
} from "./page-locale.fixtures";

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

const createClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: STALE_TIMES.THIRTY_SECONDS } },
  });

const prepareSaveRace = (locale: LocaleCode) => {
  const client = createClient();
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

const prepareTranslationClear = () => {
  const client = createClient();
  const english = makeLocaleSeoPage("en");
  const german = makeLocaleSeoPage("de");
  const page = { ...makePageListItem(PageSlug.HOME), translatedSectionCount: 1 };
  const catalog = LOCALE_CATALOG.map((locale) => ({
    ...locale,
    translatedSectionCount: locale.code === "uk" ? 1 : 0,
  }));

  client.setQueryData(adminKeys.pages.detail(PageSlug.HOME, "en"), english);
  client.setQueryData(adminKeys.pages.detail(PageSlug.HOME, "de"), german);
  endpoints.getPageBySlug
    .mockResolvedValueOnce(makeLocaleSeoPage("uk"))
    .mockResolvedValue(makeClearedLocaleSeoPage("uk"));
  endpoints.getPages
    .mockResolvedValueOnce([page])
    .mockResolvedValue([{ ...page, translatedSectionCount: 0 }]);
  endpoints.listLocales.mockResolvedValueOnce(catalog).mockResolvedValue(LOCALE_CATALOG);

  return { client, english, german, catalog };
};

describe("page editor in a language with real query hooks", () => {
  it("keeps the Ukrainian editor unavailable while its language catalog loads or fails", async () => {
    const catalog = makeDeferred<void>();

    endpoints.listLocales.mockImplementationOnce(async () => {
      await catalog.promise;

      return LOCALE_CATALOG;
    });
    render(<PagesEditView slug={PageSlug.HOME} />);

    expect(screen.getByText("Loading languages...")).toBeInTheDocument();
    expect(endpoints.getPageBySlug).not.toHaveBeenCalled();
    await act(async () => catalog.reject(new Error("Language catalog unavailable")));

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load data");
    expect(screen.queryByText("Loading languages...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update Section" })).not.toBeInTheDocument();
    expect(endpoints.getPageBySlug).not.toHaveBeenCalled();
    expect(endpoints.updateSection).not.toHaveBeenCalled();
  });

  it("clears Ukrainian through the confirmed write and refreshes both counts without changing other languages", async () => {
    const { client, english, german, catalog } = prepareTranslationClear();

    const { unmount } = render(
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
        <PagesListView />
      </QueryClientProvider>,
    );

    await screen.findByText("1 of 6 translated");
    await screen.findByLabelText("Search Result Title");
    expect(client.getQueryData(adminKeys.locales.list())).toEqual(catalog);
    clickButton("Clear Translation");
    expect(endpoints.updateSection).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Clear Translation" }),
    );
    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.HOME, {
        section: "home:seo",
        data: {},
        locale: "uk",
      }),
    );
    await screen.findByText("0 of 6 translated");
    await waitFor(() =>
      expect(client.getQueryData(adminKeys.locales.list())).toEqual(LOCALE_CATALOG),
    );
    expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Translation cleared");
    expect(screen.getByLabelText("Search Result Title")).toHaveValue("");
    expect(screen.getByLabelText("Search Result Description")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Home SEO Not translated" })).toBeInTheDocument();
    expect(client.getQueryData(adminKeys.pages.detail(PageSlug.HOME, "en"))).toEqual(english);
    expect(client.getQueryData(adminKeys.pages.detail(PageSlug.HOME, "de"))).toEqual(german);
    expect(endpoints.getPageBySlug.mock.calls).toEqual([
      [PageSlug.HOME, "uk"],
      [PageSlug.HOME, "uk"],
    ]);
    unmount();
    client.clear();
  });

  it("keeps cached Ukrainian pages mounted and unsaved words after a save's catalog refetch fails", async () => {
    const client = createClient();
    const page = makeLocaleSeoAndHeroPage();
    const pages = [makePageListItem(PageSlug.HOME)];

    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    client.setQueryData(adminKeys.pages.detail(PageSlug.HOME, "uk"), page);
    client.setQueryData(adminKeys.pages.list("uk"), pages);
    endpoints.getPageBySlug.mockResolvedValue(page);
    endpoints.listLocales.mockRejectedValue(new Error("Language catalog unavailable"));
    const editor = (
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
        <PagesListView />
      </QueryClientProvider>
    );
    const { rerender, unmount } = render(editor);

    await screen.findByLabelText("Search Result Title");
    const title = screen.getByLabelText("Search Result Title");

    typeInto("Search Result Title", "Unsaved Ukrainian word");
    setMockNavigation({ search: "locale=uk&section=home:hero" });
    rerender(
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
        <PagesListView />
      </QueryClientProvider>,
    );
    typeInto("Title", "Saved Ukrainian hero");
    const hero = screen.getByRole("region", { name: "Home Hero Translated" });

    fireEvent.click(within(hero).getByRole("button", { name: "Update Section" }));
    await waitFor(() =>
      expect(client.getQueryState(adminKeys.locales.list())?.status).toBe("error"),
    );
    expect(endpoints.updateSection).toHaveBeenCalledWith(
      PageSlug.HOME,
      expect.objectContaining({ section: "home:hero", locale: "uk" }),
    );
    expect(screen.getByLabelText("Search Result Title")).toBe(title);
    expect(title).toHaveValue("Unsaved Ukrainian word");
    expect(screen.queryByText("Failed to load data")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Page Name" })).toBeInTheDocument();
    unmount();
    client.clear();
  });

  it("refreshes an active Ukrainian page after the English save the coach left pending", async () => {
    const client = createClient();
    const patch = makeDeferred<void>();
    const ukrainianRefresh = makeDeferred<AdminPageDetails>();
    const englishTitle = "Changed English reference";

    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    client.setQueryData(adminKeys.pages.detail(PageSlug.HOME, "uk"), makeLocaleSeoPage("uk"));
    client.setQueryData(adminKeys.pages.detail(PageSlug.HOME, "en"), makeLocaleSeoPage("en"));
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    endpoints.getPageBySlug.mockImplementation((_slug, locale) =>
      locale === "uk"
        ? ukrainianRefresh.promise
        : Promise.resolve(makeLocaleSeoPage("en", englishTitle)),
    );
    const editor = (
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryClientProvider>
    );
    const { rerender, unmount } = render(editor);

    await screen.findByRole("button", { name: "Home SEO Translated" });
    setMockNavigation({ search: "" });
    rerender(
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("en title"),
    );
    typeInto("Search Result Title", englishTitle);
    clickButton("Update Section");
    await waitFor(() => expect(endpoints.updateSection).toHaveBeenCalledTimes(1));
    setMockNavigation({ search: "locale=uk" });
    rerender(
      <QueryClientProvider client={client}>
        <PagesEditView slug={PageSlug.HOME} />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Search Result Title")).toHaveValue("uk title"),
    );
    expect(endpoints.getPageBySlug).not.toHaveBeenCalled();
    await act(async () => patch.resolve());
    await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(1));
    expect(endpoints.getPageBySlug.mock.calls).toEqual([
      [PageSlug.HOME, "en"],
      [PageSlug.HOME, "uk"],
    ]);
    await act(async () => ukrainianRefresh.resolve(makeEnglishNewerSeoPage(englishTitle)));

    await screen.findByRole("button", { name: "Home SEO English is newer" });
    expect(screen.getByLabelText("Search Result Title")).toHaveAccessibleDescription(
      new RegExp(`^English ${englishTitle}`),
    );
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    expect(endpoints.getPageBySlug.mock.calls.filter(([, locale]) => locale === "en")).toHaveLength(
      1,
    );
    unmount();
    client.clear();
  });

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
