import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  PageSlug,
  type LocalizedSectionWriteBody,
} from "@repo/contracts/cms/pages";

import type * as Api from "@app/lib/api";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { makeDeferred } from "../../deferred.fixtures";
import { makePage, makeSectionRow } from "../../pages.fixtures";

const endpoints = vi.hoisted(() => ({
  getPageBySlug: vi.fn<(slug: string, locale: LocaleCode) => Promise<AdminPageDetails>>(),
  updateSection: vi.fn<(slug: string, body: LocalizedSectionWriteBody) => Promise<void>>(),
  uploadImage: vi.fn<typeof Api.api.upload.uploadImage>(),
  deleteImage: vi.fn<typeof Api.api.upload.deleteImage>(),
}));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      pages: {
        ...actual.api.pages,
        getPageBySlug: endpoints.getPageBySlug,
        updateSection: endpoints.updateSection,
      },
      upload: {
        ...actual.api.upload,
        uploadImage: endpoints.uploadImage,
        deleteImage: endpoints.deleteImage,
      },
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

const { PagesEditView } = await import("./index");

beforeEach(() => {
  endpoints.getPageBySlug.mockReset();
  endpoints.updateSection.mockReset();
  endpoints.uploadImage.mockReset();
  endpoints.deleteImage.mockReset();
});

describe("page section image save gate with real query hooks", () => {
  it("waits for a pending hero upload while keeping text editable, then saves its new URL", async () => {
    const upload = makeDeferred<void>();
    const data = { title: "Stored fixture hero", backgroundImage: "" };
    const title = "Edited fixture hero";
    const url = "https://example.com/fixture-hero.png";
    const saved = { ...data, title, backgroundImage: url };
    const file = new File(["fixture image"], "fixture-hero.png", { type: "image/png" });

    endpoints.getPageBySlug
      .mockResolvedValueOnce(makePage(PageSlug.HOME, [makeSectionRow("home:hero", data)]))
      .mockResolvedValueOnce(makePage(PageSlug.HOME, [makeSectionRow("home:hero", saved)]));
    endpoints.uploadImage.mockImplementationOnce(async () => {
      await upload.promise;

      return { url };
    });
    endpoints.updateSection.mockResolvedValueOnce(undefined);
    render(<PagesEditView slug={PageSlug.HOME} />);
    await screen.findByLabelText("Title");
    typeInto("Title", title);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Upload Image"), { target: { files: [file] } });

    await waitFor(() =>
      expect(endpoints.uploadImage).toHaveBeenCalledExactlyOnceWith(file, "marketing"),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled(),
    );
    expect(screen.getByLabelText("Title")).toBeEnabled();
    act(() => screen.getByRole("button", { name: "Update Section" }).click());
    expect(endpoints.updateSection).not.toHaveBeenCalled();

    await act(async () => upload.resolve());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled(),
    );
    expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", url);
    clickButton("Update Section");

    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.HOME, {
        locale: "en",
        section: "home:hero",
        data: saved,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled(),
    );
  });

  it("waits for a pending personal-image deletion, then saves the cleared image", async () => {
    const deletion = makeDeferred<void>();
    const data = { title: "Stored fixture personal", image: "https://example.com/fixture.png" };
    const title = "Edited fixture personal";
    const saved = { ...data, title, image: "" };

    endpoints.getPageBySlug
      .mockResolvedValueOnce(makePage(PageSlug.ABOUT, [makeSectionRow("about:personal", data)]))
      .mockResolvedValueOnce(makePage(PageSlug.ABOUT, [makeSectionRow("about:personal", saved)]));
    endpoints.deleteImage.mockReturnValueOnce(deletion.promise);
    endpoints.updateSection.mockResolvedValueOnce(undefined);
    render(<PagesEditView slug={PageSlug.ABOUT} />);
    await screen.findByLabelText("Section Title");
    typeInto("Section Title", title);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();

    clickButton("Remove");

    await waitFor(() => expect(endpoints.deleteImage).toHaveBeenCalledExactlyOnceWith(data.image));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled(),
    );
    act(() => screen.getByRole("button", { name: "Update Section" }).click());
    expect(endpoints.updateSection).not.toHaveBeenCalled();

    await act(async () => deletion.resolve());

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled(),
    );
    clickButton("Update Section");

    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.ABOUT, {
        locale: "en",
        section: "about:personal",
        data: saved,
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled(),
    );
  });
});
