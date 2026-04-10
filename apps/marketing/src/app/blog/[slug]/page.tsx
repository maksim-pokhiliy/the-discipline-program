import { cache } from "react";

import { type Metadata } from "next";

import { BLOG_CATEGORY_LABELS } from "@repo/contracts/cms/blog";

import { serverApi } from "@app/lib/api/server";
import { SEO_CONFIG } from "@app/lib/seo";
import { BlogArticlePageClient } from "@app/modules/blog-article";

const getBlogArticle = cache((slug: string) => serverApi.pages.getBlogArticle(slug));

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: BlogArticlePageProps): Promise<Metadata> => {
  const { slug } = await params;

  try {
    const { post } = await getBlogArticle(slug);

    const images = post.coverImage ? [post.coverImage] : [];

    return {
      title: `${post.title} | ${SEO_CONFIG.siteName}`,
      description: post.excerpt ?? undefined,
      keywords: post.tags.join(", "),
      openGraph: {
        type: "article",
        title: post.title,
        description: post.excerpt ?? undefined,
        images: images,
        url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
        publishedTime: post.publishedAt.toISOString(),
        authors: [post.authorName],
        section: BLOG_CATEGORY_LABELS[post.category],
        tags: post.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt ?? undefined,
        images: images,
      },
    };
  } catch {
    return {
      title: `Article Not Found | ${SEO_CONFIG.siteName}`,
      description: "The requested article could not be found.",
    };
  }
};

export const dynamic = "force-dynamic";

const BlogArticlePage = async ({ params }: BlogArticlePageProps) => {
  const { slug } = await params;
  const initialData = await getBlogArticle(slug);

  return <BlogArticlePageClient slug={slug} initialData={initialData} />;
};

export default BlogArticlePage;
