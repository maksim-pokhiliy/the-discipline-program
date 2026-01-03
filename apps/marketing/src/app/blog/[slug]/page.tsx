import { type Metadata } from "next";

import { SEO_CONFIG } from "@repo/shared";

import { api } from "@app/lib/api";
import { BlogArticlePageClient } from "@app/modules/blog-article";

interface BlogArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { post } = await api.pages.getBlogArticle(slug);

    return {
      title: `${post.title} | The Discipline Program`,
      description: post.excerpt,
      keywords: post.tags?.join(", "),
      openGraph: {
        type: "article",
        title: post.title,
        description: post.excerpt,
        images: [post.coverImage],
        url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
        publishedTime: post.publishedAt.toISOString(),
        authors: [post.author],
        section: post.category,
        tags: post.tags,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [post.coverImage],
      },
    };
  } catch {
    return {
      title: "Article Not Found | The Discipline Program",
      description: "The requested article could not be found.",
    };
  }
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const initialData = await api.pages.getBlogArticle(slug);

  return <BlogArticlePageClient slug={slug} initialData={initialData} />;
}
