export const UPLOAD_CONFIG = {
  avatar: {
    maxSize: 2 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    storagePrefix: "avatars",
  },
  blog: {
    maxSize: 5 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    storagePrefix: "blog",
  },
} as const;

export type UploadContext = keyof typeof UPLOAD_CONFIG;
