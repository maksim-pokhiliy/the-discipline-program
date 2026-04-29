export const BLOB_STORAGE_DOMAIN = ".public.blob.vercel-storage.com";

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
  marketing: {
    maxSize: 5 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    storagePrefix: "marketing",
  },
  exercise: {
    maxSize: 5 * 1024 * 1024,
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    storagePrefix: "exercises",
  },
} as const;
