"use client";

import { type BlogPostPageData } from "@repo/contracts/blog";
import { QueryWrapper } from "@repo/query";
import { SEO_CONFIG } from "@repo/shared";

import { StructuredData } from "@app/lib/components/seo";
import { useBlogArticle } from "@app/lib/hooks";

import { BlogArticleContent, BlogArticleHero, BlogArticleRelated } from "./sections";

interface BlogArticlePageClientProps {
  slug: string;
  initialData: BlogPostPageData;
}

export const BlogArticlePageClient = ({ slug, initialData }: BlogArticlePageClientProps) => {
  const { data, isLoading, error } = useBlogArticle(slug, { initialData });

  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading article..."
    >
      {(data) => (
        <>
          <StructuredData
            type="article"
            data={{
              title: data.post.title,
              description: data.post.excerpt ?? "",
              image: data.post.coverImage ?? "",
              author: data.post.authorName,
              publishedTime: `${data.post.publishedAt}`,
              url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
            }}
          />

          <BlogArticleHero post={data.post} />
          <BlogArticleContent post={data.post} />

          {data.relatedPosts.length > 0 && <BlogArticleRelated relatedPosts={data.relatedPosts} />}
        </>
      )}
    </QueryWrapper>
  );
};
