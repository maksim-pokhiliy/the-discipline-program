"use client";

import { Stack } from "@mui/material";
import { QueryWrapper } from "@repo/query";
import { SEO_CONFIG } from "@repo/shared";
import Head from "next/head";
import { useParams } from "next/navigation";

import { useBlogArticle } from "@app/lib/hooks";
import { StructuredData } from "@app/shared/components/seo";

import { BlogArticleContent, BlogArticleHero, BlogArticleRelated } from "./sections";

export const BlogArticlePage = () => {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading, error } = useBlogArticle(slug);

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
