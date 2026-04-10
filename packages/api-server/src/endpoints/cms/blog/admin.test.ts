import { afterAll, describe, expect, it } from "vitest";

import { BlogCategory } from "@repo/contracts/cms/blog";

import { cleanupRaw } from "../../../test/helpers";

import { adminBlogApi } from "./admin";

const createSlug = () => `test-${crypto.randomUUID().slice(0, 12)}`;

const baseBlogData = (overrides: Record<string, unknown> = {}) => ({
  title: "Test Post",
  slug: createSlug(),
  content: "Short content here",
  authorName: "Test Author",
  isPublished: false,
  isFeatured: false,
  readTime: null,
  publishedAt: null,
  coverImage: null,
  excerpt: null,
  category: BlogCategory.UNCATEGORIZED,
  tags: [],
  ...overrides,
});

describe("adminBlogApi", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    for (const id of createdIds.reverse()) {
      await cleanupRaw.marketingBlogPost.delete({ where: { id } }).catch(() => {});
    }
  });

  describe("calculateReadTime (tested through createPost)", () => {
    it("empty content gives readTime 0", async () => {
      const post = await adminBlogApi.createPost(baseBlogData({ content: "   " }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(0);
    });

    it("short content gives readTime 1", async () => {
      const post = await adminBlogApi.createPost(baseBlogData({ content: "Hello world" }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(1);
    });

    it("200 words gives readTime 1", async () => {
      const content = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
      const post = await adminBlogApi.createPost(baseBlogData({ content }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(1);
    });

    it("201 words gives readTime 2", async () => {
      const content = Array.from({ length: 201 }, (_, i) => `word${i}`).join(" ");
      const post = await adminBlogApi.createPost(baseBlogData({ content }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(2);
    });

    it("400 words gives readTime 2", async () => {
      const content = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
      const post = await adminBlogApi.createPost(baseBlogData({ content }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(2);
    });

    it("1000 words gives readTime 5", async () => {
      const content = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(" ");
      const post = await adminBlogApi.createPost(baseBlogData({ content }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(5);
    });
  });

  describe("createPost", () => {
    it("sets publishedAt when isPublished is true", async () => {
      const before = new Date();
      const post = await adminBlogApi.createPost(baseBlogData({ isPublished: true }));

      createdIds.push(post.id);

      expect(post.publishedAt).toBeInstanceOf(Date);

      if (!post.publishedAt) {
        throw new Error("expected publishedAt");
      }

      expect(post.publishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it("does NOT set publishedAt for draft", async () => {
      const post = await adminBlogApi.createPost(baseBlogData({ isPublished: false }));

      createdIds.push(post.id);

      expect(post.publishedAt).toBeNull();
    });

    it("unfeatures other posts when new post is featured", async () => {
      const first = await adminBlogApi.createPost(
        baseBlogData({ isFeatured: true, isPublished: true }),
      );

      createdIds.push(first.id);

      const second = await adminBlogApi.createPost(
        baseBlogData({ isFeatured: true, isPublished: true }),
      );

      createdIds.push(second.id);

      const firstAfter = await adminBlogApi.getPostById(first.id);

      expect(firstAfter?.isFeatured).toBe(false);
      expect(second.isFeatured).toBe(true);
    });

    it("calculates readTime from content", async () => {
      const content = Array.from({ length: 600 }, (_, i) => `word${i}`).join(" ");
      const post = await adminBlogApi.createPost(baseBlogData({ content }));

      createdIds.push(post.id);

      expect(post.readTime).toBe(3);
    });
  });

  describe("updatePost", () => {
    it("recalculates readTime when content changes", async () => {
      const post = await adminBlogApi.createPost(baseBlogData({ content: "short" }));

      createdIds.push(post.id);

      const longContent = Array.from({ length: 800 }, (_, i) => `word${i}`).join(" ");
      const updated = await adminBlogApi.updatePost(post.id, { content: longContent });

      expect(updated.readTime).toBe(4);
    });

    it("sets publishedAt on draft to published transition", async () => {
      const post = await adminBlogApi.createPost(baseBlogData({ isPublished: false }));

      createdIds.push(post.id);

      expect(post.publishedAt).toBeNull();

      const before = new Date();
      const updated = await adminBlogApi.updatePost(post.id, { isPublished: true });

      expect(updated.publishedAt).toBeInstanceOf(Date);

      if (!updated.publishedAt) {
        throw new Error("expected publishedAt");
      }

      expect(updated.publishedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it("does NOT overwrite existing publishedAt", async () => {
      const originalDate = new Date("2024-01-01T00:00:00Z");
      const post = await adminBlogApi.createPost(
        baseBlogData({ isPublished: true, publishedAt: originalDate }),
      );

      createdIds.push(post.id);

      const updated = await adminBlogApi.updatePost(post.id, {
        isPublished: true,
        title: "Updated title",
      });

      expect(updated.publishedAt?.toISOString()).toBe(originalDate.toISOString());
    });

    it("featured toggle with atomic deduplication", async () => {
      const a = await adminBlogApi.createPost(baseBlogData({ isFeatured: true }));

      createdIds.push(a.id);

      const b = await adminBlogApi.createPost(baseBlogData());

      createdIds.push(b.id);

      const updated = await adminBlogApi.updatePost(b.id, { isFeatured: true });

      expect(updated.isFeatured).toBe(true);

      const aAfter = await adminBlogApi.getPostById(a.id);

      expect(aAfter?.isFeatured).toBe(false);
    });
  });

  describe("toggleBlogPostFeatured", () => {
    it("toggle ON unfeatures all others", async () => {
      const existing = await adminBlogApi.createPost(baseBlogData({ isFeatured: true }));

      createdIds.push(existing.id);

      const target = await adminBlogApi.createPost(baseBlogData({ isFeatured: false }));

      createdIds.push(target.id);

      const toggled = await adminBlogApi.toggleBlogPostFeatured(target.id);

      expect(toggled.isFeatured).toBe(true);

      const existingAfter = await adminBlogApi.getPostById(existing.id);

      expect(existingAfter?.isFeatured).toBe(false);
    });

    it("toggle OFF keeps others unchanged", async () => {
      const other = await adminBlogApi.createPost(baseBlogData({ isFeatured: false }));

      createdIds.push(other.id);

      const target = await adminBlogApi.createPost(baseBlogData({ isFeatured: true }));

      createdIds.push(target.id);

      const toggled = await adminBlogApi.toggleBlogPostFeatured(target.id);

      expect(toggled.isFeatured).toBe(false);

      const otherAfter = await adminBlogApi.getPostById(other.id);

      expect(otherAfter?.isFeatured).toBe(false);
    });
  });
});
