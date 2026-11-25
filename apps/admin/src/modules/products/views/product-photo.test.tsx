import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CreateProductData,
  type UpdateProductData,
  createProductRequestSchema,
  updateProductRequestSchema,
} from "@repo/contracts/cms/product";

import type * as Api from "@app/lib/api";
import type * as Hooks from "@app/lib/hooks";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { makePrice, makeProduct } from "../products.fixtures";

import { ProductCreateView } from "./product-create-view";
import { ProductEditForm } from "./product-edit-view/product-edit-form";

const endpoints = vi.hoisted(() => ({
  uploadImage: vi.fn<typeof Api.api.upload.uploadImage>(),
  deleteImage: vi.fn<typeof Api.api.upload.deleteImage>(),
  create: vi.fn<(data: CreateProductData) => void>(),
  update: vi.fn<(body: { id: string; data: UpdateProductData }) => void>(),
}));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      upload: {
        ...actual.api.upload,
        uploadImage: endpoints.uploadImage,
        deleteImage: endpoints.deleteImage,
      },
    },
  };
});
vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateProduct: () => ({ mutate: endpoints.create, isPending: false }),
    useUpdateProduct: () => ({ mutate: endpoints.update, isPending: false }),
  };
});
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PREVIOUS = "https://synthetic.public.blob.vercel-storage.com/products/previous.jpg";
const PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/uploaded.jpg";
const FILE = new File(["synthetic photo"], "photo.jpg", { type: "image/jpeg" });
const MODES: [string, boolean][] = [
  ["create", true],
  ["edit", false],
];

const deferredUpload = (): {
  promise: Promise<{ url: string }>;
  resolve: (value: { url: string }) => void;
  reject: (error: Error) => void;
} => {
  let resolve: (value: { url: string }) => void = () => {
    throw new Error("Upload promise was not initialized");
  };
  let reject: (error: Error) => void = () => {
    throw new Error("Upload promise was not initialized");
  };
  const promise = new Promise<{ url: string }>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, resolve, reject };
};

const renderForm = (isCreate: boolean): void => {
  if (isCreate) {
    render(<ProductCreateView />);
    typeInto("Product Title", "Synthetic product");
    typeInto("Description", "Synthetic description");
    typeInto("Price", "10");

    return;
  }

  render(<ProductEditForm product={{ ...makeProduct([makePrice()]), imageUrl: PREVIOUS }} />);
};

beforeEach(() => {
  vi.clearAllMocks();
  endpoints.uploadImage.mockReset();
});

describe("product photo upload", () => {
  it.each(MODES)(
    "%s Save waits for upload and writes its returned photo",
    async (_name, isCreate) => {
      const upload = deferredUpload();
      const label = isCreate ? "Create Product" : "Save Changes";

      endpoints.uploadImage.mockReturnValueOnce(upload.promise);
      renderForm(isCreate);
      fireEvent.change(screen.getByLabelText("Product photo"), { target: { files: [FILE] } });

      await waitFor(() =>
        expect(endpoints.uploadImage).toHaveBeenCalledExactlyOnceWith(FILE, "product"),
      );
      await waitFor(() => expect(screen.getByRole("button", { name: label })).toBeDisabled());
      expect(screen.getByText("Uploading...")).toBeInTheDocument();
      act(() => screen.getByRole("button", { name: label }).click());
      expect(endpoints.create).not.toHaveBeenCalled();
      expect(endpoints.update).not.toHaveBeenCalled();

      await act(async () => upload.resolve({ url: PHOTO }));
      await waitFor(() => expect(screen.getByRole("button", { name: label })).toBeEnabled());
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", PHOTO);
      clickButton(label);

      if (isCreate) {
        await waitFor(() => expect(endpoints.create).toHaveBeenCalledTimes(1));
        expect(createProductRequestSchema.parse(endpoints.create.mock.calls[0]?.[0]).imageUrl).toBe(
          PHOTO,
        );
      } else {
        await waitFor(() => expect(endpoints.update).toHaveBeenCalledTimes(1));
        expect(
          updateProductRequestSchema.parse(endpoints.update.mock.calls[0]?.[0]?.data).imageUrl,
        ).toBe(PHOTO);
      }

      expect(endpoints.deleteImage).not.toHaveBeenCalled();
    },
  );

  it.each(MODES)("a failed %s upload preserves the previous photo", async (_name, isCreate) => {
    const upload = deferredUpload();
    const label = isCreate ? "Create Product" : "Save Changes";

    endpoints.uploadImage.mockReturnValueOnce(upload.promise);
    renderForm(isCreate);
    fireEvent.change(screen.getByLabelText("Product photo"), { target: { files: [FILE] } });
    await waitFor(() => expect(screen.getByRole("button", { name: label })).toBeDisabled());
    await act(async () => upload.reject(new Error("Synthetic upload failure")));
    await waitFor(() => expect(screen.getByRole("button", { name: label })).toBeEnabled());

    if (isCreate) {
      expect(screen.queryByRole("img", { name: "Preview" })).not.toBeInTheDocument();
    } else {
      expect(screen.getByRole("img", { name: "Preview" })).toHaveAttribute("src", PREVIOUS);
    }

    clickButton(label);

    if (isCreate) {
      await waitFor(() => expect(endpoints.create).toHaveBeenCalledTimes(1));
      expect(
        createProductRequestSchema.parse(endpoints.create.mock.calls[0]?.[0]).imageUrl,
      ).toBeNull();
    } else {
      await waitFor(() => expect(endpoints.update).toHaveBeenCalledTimes(1));
      expect(
        updateProductRequestSchema.parse(endpoints.update.mock.calls[0]?.[0]?.data).imageUrl,
      ).toBe(PREVIOUS);
    }

    expect(endpoints.deleteImage).not.toHaveBeenCalled();
  });

  it("Remove writes null on Save and never deletes a Blob from the UI", async () => {
    renderForm(false);
    clickButton("Remove");

    expect(screen.queryByRole("img", { name: "Preview" })).not.toBeInTheDocument();
    expect(endpoints.deleteImage).not.toHaveBeenCalled();
    expect(endpoints.update).not.toHaveBeenCalled();
    clickButton("Save Changes");
    await waitFor(() => expect(endpoints.update).toHaveBeenCalledTimes(1));
    expect(
      updateProductRequestSchema.parse(endpoints.update.mock.calls[0]?.[0]?.data).imageUrl,
    ).toBeNull();
    expect(endpoints.deleteImage).not.toHaveBeenCalled();
  });
});
