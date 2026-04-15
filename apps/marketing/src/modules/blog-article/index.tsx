import { type BlogPostPageData } from "@repo/contracts/cms/blog";

import { StructuredData } from "@app/lib/components/seo";
import { SEO_CONFIG } from "@app/lib/seo";

import { BlogArticleContent, BlogArticleHero, BlogArticleRelated } from "./sections";

type BlogArticlePageContentProps = {
  slug: string;
  data: BlogPostPageData;
};

export const BlogArticlePageContent = ({ slug, data }: BlogArticlePageContentProps) => (
  <>
    <StructuredData
      type="article"
      data={{
        title: data.post.title,
        description: data.post.excerpt ?? "",
        image: data.post.coverImage ?? "",
        author: data.post.authorName,
        publishedTime: new Date(data.post.publishedAt).toISOString(),
        url: `${SEO_CONFIG.siteUrl}/blog/${slug}`,
      }}
    />

    <BlogArticleHero post={data.post} labels={data.labels} />
    <BlogArticleContent post={data.post} />

    {data.relatedPosts.length > 0 && (
      <BlogArticleRelated
        relatedPosts={data.relatedPosts}
        sectionTitle={data.relatedSectionTitle}
        labels={data.labels}
      />
    )}
  </>
);
