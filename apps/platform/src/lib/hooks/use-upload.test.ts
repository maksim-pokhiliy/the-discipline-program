import { createElement, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UploadContext } from "@repo/contracts/storage/upload";
import type * as Query from "@repo/query";

const uploadImageMock = vi.fn<(file: File, context: UploadContext) => Promise<{ url: string }>>();
const notifyErrorMock = vi.fn<(error: Error, fallback: string) => void>();

vi.mock("../api", () => ({
  api: {
    upload: {
      uploadImage: (file: File, context: UploadContext) => uploadImageMock(file, context),
    },
  },
}));

vi.mock("@repo/query", async (importOriginal) => {
  const actual = await importOriginal<typeof Query>();

  return {
    ...actual,
    notifyError: (error: Error, fallback: string) => notifyErrorMock(error, fallback),
  };
});

const { useUploadImage } = await import("./use-upload");

const renderRunner = () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return renderHook(() => useUploadImage(), { wrapper });
};

describe("useUploadImage", () => {
  beforeEach(() => {
    uploadImageMock.mockReset();
    notifyErrorMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls api.upload.uploadImage with the file and the avatar context", async () => {
    uploadImageMock.mockResolvedValueOnce({ url: "https://blob.example.com/avatars/x.png" });

    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const view = renderRunner();

    await act(async () => {
      view.result.current.mutate({ file, context: "avatar" });
    });

    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    expect(uploadImageMock).toHaveBeenCalledWith(file, "avatar");
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("notifies with the fallback message when the upload fails", async () => {
    const failure = new Error("upload failed");

    uploadImageMock.mockRejectedValueOnce(failure);

    const file = new File(["data"], "avatar.png", { type: "image/png" });
    const view = renderRunner();

    await act(async () => {
      view.result.current.mutate({ file, context: "avatar" });
    });

    await waitFor(() => expect(view.result.current.isError).toBe(true));

    expect(notifyErrorMock).toHaveBeenCalledWith(failure, "Failed to upload image");
  });
});
