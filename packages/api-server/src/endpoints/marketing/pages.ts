import { type MarketingBlogPost, type MarketingFeature } from "@prisma/client";

import { type PublicBlogPost, type BlogPostPageData } from "@repo/contracts/blog";
import { type Feature } from "@repo/contracts/feature";
import {
  type HomePageData,
  type ProgramsPageData,
  type AboutPageData,
  type BlogPageData,
  type ContactPageData,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

import { prisma } from "../../db/client";

type PublishedPost = MarketingBlogPost & { publishedAt: Date };

function hasPublishedDate(post: MarketingBlogPost): post is PublishedPost {
  return post.publishedAt !== null;
}

const mapToPublicBlogPost = (post: PublishedPost): PublicBlogPost => {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt,
    isFeatured: post.isFeatured,
    readTime: post.readTime,
    author: post.authorName,
    category: post.category,
    tags: post.tags,
  };
};

const mapToFeature = (feature: MarketingFeature): Feature => ({
  id: feature.id,
  title: feature.title,
  description: feature.description,
  iconName: feature.iconName,
  isActive: feature.isActive,
});

export const pagesApi = {
  getHomePage: async (): Promise<HomePageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "home", isActive: true },
    });

    const [programs, reviews, features] = await Promise.all([
      prisma.marketingProgramPreview.findMany({ where: { isActive: true } }),
      prisma.marketingReview.findMany({ where: { isActive: true } }),
      prisma.marketingFeature.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      if (!section) {
        throw new Error(`Section '${sectionName}' not found for home page`);
      }

      return section.data as T;
    };

    return {
      hero: getSectionData<HomePageData["hero"]>("hero"),
      whyChoose: getSectionData<HomePageData["whyChoose"]>("whyChoose"),
      programs: getSectionData<HomePageData["programs"]>("programs"),
      reviews: getSectionData<HomePageData["reviews"]>("reviews"),
      contact: getSectionData<HomePageData["contact"]>("contact"),

      features: features.map(mapToFeature),
      programsList: programs,
      reviewsList: reviews,
    };
  },

  getProgramsPage: async (): Promise<ProgramsPageData> => {
    const [sections, programs] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: "programs", isActive: true } }),
      prisma.marketingProgramPreview.findMany({
        where: { isActive: true },
      }),
    ]);

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      if (!section) {
        throw new Error(`Section '${sectionName}' not found`);
      }

      return section.data as T;
    };

    return {
      hero: getSectionData<ProgramsPageData["hero"]>("hero"),
      programsList: programs,
    };
  },

  getAboutPage: async (): Promise<AboutPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "about", isActive: true },
    });

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      if (!section) {
        throw new Error(`Section '${sectionName}' not found`);
      }

      return section.data as T;
    };

    return {
      hero: getSectionData<AboutPageData["hero"]>("hero"),
      journey: getSectionData<AboutPageData["journey"]>("journey"),
      credentials: getSectionData<AboutPageData["credentials"]>("credentials"),
      personal: getSectionData<AboutPageData["personal"]>("personal"),
      cta: getSectionData<AboutPageData["cta"]>("cta"),
    };
  },

  getBlogPage: async (): Promise<BlogPageData> => {
    const [sections, posts] = await Promise.all([
      prisma.marketingPageSection.findMany({ where: { pageSlug: "blog", isActive: true } }),
      prisma.marketingBlogPost.findMany({
        where: {
          isPublished: true,
          coverImage: { not: null },
          publishedAt: { not: null },
        },
        orderBy: { publishedAt: "desc" },
      }),
    ]);

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      if (!section) {
        throw new Error(`Section '${sectionName}' not found`);
      }

      return section.data as T;
    };

    const publicPosts = posts.filter(hasPublishedDate).map(mapToPublicBlogPost);

    const featuredPost = publicPosts.find((post) => post.isFeatured) || publicPosts[0];
    const categories = [...new Set(publicPosts.map((post) => post.category))];

    return {
      hero: getSectionData<BlogPageData["hero"]>("hero"),
      featuredPost,
      posts: publicPosts,
      categories,
    };
  },

  getContactPage: async (): Promise<ContactPageData> => {
    const sections = await prisma.marketingPageSection.findMany({
      where: { pageSlug: "contact", isActive: true },
    });

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      if (!section) {
        throw new Error(`Section '${sectionName}' not found`);
      }

      return section.data as T;
    };

    return {
      hero: getSectionData<ContactPageData["hero"]>("hero"),
      form: getSectionData<ContactPageData["form"]>("form"),
      directContact: getSectionData<ContactPageData["directContact"]>("directContact"),
      faq: getSectionData<ContactPageData["faq"]>("faq"),
    };
  },

  getBlogArticle: async (slug: string): Promise<BlogPostPageData> => {
    const post = await prisma.marketingBlogPost.findFirst({
      where: {
        slug,
        isPublished: true,
        coverImage: { not: null },
        publishedAt: { not: null },
      },
    });

    if (!post || !hasPublishedDate(post)) {
      throw new NotFoundError(`Article not found: ${slug}`, { slug });
    }

    const publicPost = mapToPublicBlogPost(post);

    const relatedPostsRaw = await prisma.marketingBlogPost.findMany({
      where: {
        isPublished: true,
        category: post.category,
        id: { not: post.id },
        coverImage: { not: null },
        publishedAt: { not: null },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    });

    const relatedPosts = relatedPostsRaw.filter(hasPublishedDate).map(mapToPublicBlogPost);

    return {
      post: publicPost,
      relatedPosts,
    };
  },
};
