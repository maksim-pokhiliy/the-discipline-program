"use client";

import { Stack } from "@mui/material";
import { BlogPostPageData } from "@repo/api";
import { QueryWrapper } from "@repo/query";
import { SEO_CONFIG } from "@repo/shared";
import Head from "next/head";

import { useBlogArticle } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

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
          <Head>
            <StructuredData
              type="article"
              data={{
                title: data.post.title,
                description: data.post.excerpt,
                image: data.post.coverImage,
                author: data.post.author,
                publishedTime: `${data.post.publishedAt}`,
                url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
              }}
            />
          </Head>

          <Stack spacing={0}>
            <BlogArticleHero post={data.post} />
            <BlogArticleContent post={data.post} />

            {data.relatedPosts.length > 0 && (
              <BlogArticleRelated relatedPosts={data.relatedPosts} />
            )}
          </Stack>
        </>
      )}
    </QueryWrapper>
  );
};
