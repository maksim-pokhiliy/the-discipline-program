import {
  AboutPageData,
  BlogPageData,
  BlogPost,
  BlogPostPageData,
  ContactPageData,
  HomePageData,
  ProgramsPageData,
  RawBlogPost,
} from "../../types";
import { prisma } from "../../db/client";

const transformPost = (post: RawBlogPost): BlogPost => ({
  ...post,
  coverImage: post.coverImage || "/images/default-blog-cover.jpg",
  publishedAt: post.publishedAt || new Date(),
});

export const pagesApi = {
  getHomePage: async (): Promise<HomePageData> => {
    const sections = await prisma.pageSection.findMany({
      where: { pageSlug: "home", isActive: true },
    });

    const [features, programs, rawReviews] = await Promise.all([
      prisma.feature.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.program.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.review.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const reviews = rawReviews.map((review) => review);

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      return section?.data as T;
    };

    return {
      hero: getSectionData<HomePageData["hero"]>("hero"),
      whyChoose: getSectionData<HomePageData["whyChoose"]>("whyChoose"),
      programs: getSectionData<HomePageData["programs"]>("programs"),
      reviews: getSectionData<HomePageData["reviews"]>("reviews"),
      contact: getSectionData<HomePageData["contact"]>("contact"),
      features,
      programsList: programs,
      reviewsList: reviews,
    };
  },

  getProgramsPage: async (): Promise<ProgramsPageData> => {
    const [sections, programs] = await Promise.all([
      prisma.pageSection.findMany({ where: { pageSlug: "programs", isActive: true } }),
      prisma.program.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      return section?.data as T;
    };

    return {
      hero: getSectionData<ProgramsPageData["hero"]>("hero"),
      programsList: programs,
    };
  },

  getAboutPage: async (): Promise<AboutPageData> => {
    const sections = await prisma.pageSection.findMany({
      where: { pageSlug: "about", isActive: true },
    });

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      return section?.data as T;
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
      prisma.pageSection.findMany({ where: { pageSlug: "blog", isActive: true } }),
      prisma.blogPost.findMany({
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

      return section?.data as T;
    };

    const featuredPost = posts.find((post) => post.isFeatured);
    const categories = [...new Set(posts.map((post) => post.category))];

    return {
      hero: getSectionData<BlogPageData["hero"]>("hero"),
      featuredPost: featuredPost ? transformPost(featuredPost) : undefined,
      posts: posts.map(transformPost),
      categories,
    };
  },

  getContactPage: async (): Promise<ContactPageData> => {
    const sections = await prisma.pageSection.findMany({
      where: { pageSlug: "contact", isActive: true },
    });

    const getSectionData = <T>(sectionName: string): T => {
      const section = sections.find((s) => s.section === sectionName);

      return section?.data as T;
    };

    return {
      hero: getSectionData<ContactPageData["hero"]>("hero"),
      form: getSectionData<ContactPageData["form"]>("form"),
      directContact: getSectionData<ContactPageData["directContact"]>("directContact"),
      faq: getSectionData<ContactPageData["faq"]>("faq"),
    };
  },

  getBlogArticle: async (slug: string): Promise<BlogPostPageData> => {
    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });

    if (!post) {
      throw new Error(`Article not found: ${slug}`);
    }

    const relatedPosts = await prisma.blogPost.findMany({
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

    return {
      post: transformPost(post),
      relatedPosts: relatedPosts.map(transformPost),
    };
  },
};
