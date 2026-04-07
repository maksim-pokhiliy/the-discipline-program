import { type Metadata } from "next";

import { BLOG_CATEGORY_LABELS } from "@repo/contracts/blog";
import { SEO_CONFIG } from "@repo/shared";

import { serverApi } from "@app/lib/api/server";
import { BlogArticlePageClient } from "@app/modules/blog-article";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { post } = await serverApi.pages.getBlogArticle(slug);

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
}

export const dynamic = "force-dynamic";

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const initialData = await serverApi.pages.getBlogArticle(slug);

  return <BlogArticlePageClient slug={slug} initialData={initialData} />;
}
