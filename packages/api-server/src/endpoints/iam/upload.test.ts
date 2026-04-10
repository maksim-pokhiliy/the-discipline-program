import { beforeEach, describe, expect, it, vi } from "vitest";

import { UPLOAD_CONFIG, type UploadContext } from "@repo/contracts/iam/upload";
import { BadRequestError, ValidationError } from "@repo/errors";

import type { StoragePort } from "../../infrastructure/storage";

import { createIamUploadAdminApi } from "./upload";

const makeFakeStorage = (): StoragePort & {
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
} => ({
  put: vi.fn(async (_key: string, _file: File) => ({ url: "https://fake.storage/object" })),
  delete: vi.fn(async (_url: string) => undefined),
});

const makeImageFile = (name: string, type: string, sizeBytes: number): File => {
  const content = new Uint8Array(sizeBytes);

  return new File([content], name, { type });
};

describe("createIamUploadAdminApi", () => {
  let storage: ReturnType<typeof makeFakeStorage>;

  beforeEach(() => {
    storage = makeFakeStorage();
  });

  describe("uploadImage", () => {
    it("uploads a valid image and returns the storage url", async () => {
      const api = createIamUploadAdminApi(storage);
      const file = makeImageFile("cover.png", "image/png", 1024);

      const result = await api.uploadImage(file, "blog");

      expect(storage.put).toHaveBeenCalledTimes(1);
      const [key, receivedFile, options] = storage.put.mock.calls[0] ?? [];

      expect(key).toMatch(/^blog\/\d+-cover\.png$/);
      expect(receivedFile).toBe(file);
      expect(options).toEqual({ access: "public" });
      expect(result).toEqual({ url: "https://fake.storage/object" });
    });

    it("sanitizes special characters in the filename", async () => {
      const api = createIamUploadAdminApi(storage);
      const file = makeImageFile("my file (final)!.png", "image/png", 1024);

      await api.uploadImage(file, "blog");

      const [key] = storage.put.mock.calls[0] ?? [];

      expect(key).toMatch(/^blog\/\d+-my-file--final--\.png$/);
      expect(key).not.toMatch(/[() !]/);
    });

    it.each<{ context: UploadContext; expectedPrefix: string }>([
      { context: "avatar", expectedPrefix: "avatars" },
      { context: "blog", expectedPrefix: "blog" },
      { context: "marketing", expectedPrefix: "marketing" },
    ])(
      "uses the $expectedPrefix storage prefix for $context context",
      async ({ context, expectedPrefix }) => {
        const api = createIamUploadAdminApi(storage);
        const file = makeImageFile("pic.jpg", "image/jpeg", 1024);

        await api.uploadImage(file, context);

        const [key] = storage.put.mock.calls[0] ?? [];

        expect(key).toMatch(new RegExp(`^${expectedPrefix}/\\d+-pic\\.jpg$`));
        expect(UPLOAD_CONFIG[context].storagePrefix).toBe(expectedPrefix);
      },
    );

    it("throws ValidationError for disallowed file types and does not call storage", async () => {
      const api = createIamUploadAdminApi(storage);
      const file = makeImageFile("notes.txt", "text/plain", 1024);

      await expect(api.uploadImage(file, "blog")).rejects.toBeInstanceOf(ValidationError);
      expect(storage.put).not.toHaveBeenCalled();
    });

    it("throws ValidationError when file exceeds maxSize and does not call storage", async () => {
      const api = createIamUploadAdminApi(storage);
      const oversize = UPLOAD_CONFIG.blog.maxSize + 1;
      const file = makeImageFile("huge.png", "image/png", oversize);

      await expect(api.uploadImage(file, "blog")).rejects.toBeInstanceOf(ValidationError);
      expect(storage.put).not.toHaveBeenCalled();
    });
  });

  describe("deleteImage", () => {
    it("delegates to storage.delete with the given url", async () => {
      const api = createIamUploadAdminApi(storage);

      await api.deleteImage("https://fake.storage/object");

      expect(storage.delete).toHaveBeenCalledTimes(1);
      expect(storage.delete).toHaveBeenCalledWith("https://fake.storage/object");
    });

    it("throws BadRequestError for an empty url and does not call storage", async () => {
      const api = createIamUploadAdminApi(storage);

      await expect(api.deleteImage("")).rejects.toBeInstanceOf(BadRequestError);
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });
});
