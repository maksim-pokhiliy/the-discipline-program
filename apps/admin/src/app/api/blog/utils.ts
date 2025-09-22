import type { AdminBlogPost } from "@repo/api";

type BlogPostCreateData = Omit<AdminBlogPost, "id" | "createdAt" | "updatedAt">;
type BlogPostUpdateData = Partial<BlogPostCreateData>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};

const toNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  }

  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const toNullableNumber = (value: unknown): number | null | undefined => {
  if (value === null) {
    return null;
  }

  const parsed = toNumber(value);

  return parsed === undefined ? undefined : parsed;
};

const toStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
};

const toNullableDate = (value: unknown): Date | null | undefined => {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return undefined;
};

const requireStringField = (
  record: Record<string, unknown>,
  field: keyof BlogPostCreateData,
): string => {
  const value = toNonEmptyString(record[field]);

  if (!value) {
    throw new Error(`Invalid ${String(field)} value`);
  }

  return value;
};

export const normalizeCreateBlogPayload = (payload: unknown): BlogPostCreateData => {
  if (!isRecord(payload)) {
    throw new Error("Invalid payload");
  }

  return {
    title: requireStringField(payload, "title"),
    slug: requireStringField(payload, "slug"),
    excerpt: requireStringField(payload, "excerpt"),
    content: requireStringField(payload, "content"),
    coverImage: toNullableString(payload.coverImage) ?? null,
    author: requireStringField(payload, "author"),
    category: requireStringField(payload, "category"),
    tags: toStringArray(payload.tags) ?? [],
    readTime: toNullableNumber(payload.readTime) ?? null,
    isPublished: toBoolean(payload.isPublished) ?? false,
    isFeatured: toBoolean(payload.isFeatured) ?? false,
    sortOrder: toNumber(payload.sortOrder) ?? 0,
    publishedAt: toNullableDate(payload.publishedAt) ?? null,
  };
};

export const normalizeUpdateBlogPayload = (payload: unknown): BlogPostUpdateData => {
  if (!isRecord(payload)) {
    return {};
  }

  const record: Record<string, unknown> = payload;
  const result: BlogPostUpdateData = {};

  if ("title" in record) {
    const value = toNonEmptyString(record.title);

    if (value !== undefined) {
      result.title = value;
    }
  }

  if ("slug" in record) {
    const value = toNonEmptyString(record.slug);

    if (value !== undefined) {
      result.slug = value;
    }
  }

  if ("excerpt" in record) {
    const value = toNonEmptyString(record.excerpt);

    if (value !== undefined) {
      result.excerpt = value;
    }
  }

  if ("content" in record) {
    const value = toNonEmptyString(record.content);

    if (value !== undefined) {
      result.content = value;
    }
  }

  if ("coverImage" in record) {
    const value = toNullableString(record.coverImage);

    if (value !== undefined) {
      result.coverImage = value;
    }
  }

  if ("author" in record) {
    const value = toNonEmptyString(record.author);

    if (value !== undefined) {
      result.author = value;
    }
  }

  if ("category" in record) {
    const value = toNonEmptyString(record.category);

    if (value !== undefined) {
      result.category = value;
    }
  }

  if ("tags" in record) {
    const value = toStringArray(record.tags);

    if (value !== undefined) {
      result.tags = value;
    }
  }

  if ("readTime" in record) {
    const value = toNullableNumber(record.readTime);

    if (value !== undefined) {
      result.readTime = value;
    }
  }

  if ("isPublished" in record) {
    const value = toBoolean(record.isPublished);

    if (value !== undefined) {
      result.isPublished = value;
    }
  }

  if ("isFeatured" in record) {
    const value = toBoolean(record.isFeatured);

    if (value !== undefined) {
      result.isFeatured = value;
    }
  }

  if ("sortOrder" in record) {
    const value = toNumber(record.sortOrder);

    if (value !== undefined) {
      result.sortOrder = value;
    }
  }

  if ("publishedAt" in record) {
    const value = toNullableDate(record.publishedAt);

    if (value !== undefined) {
      result.publishedAt = value;
    }
  }

  return result;
};

export type { BlogPostCreateData, BlogPostUpdateData };
