"use client";

import dynamic from "next/dynamic";

import { type PublicBlogPost } from "@repo/contracts/cms/blog";
import { ContentSection } from "@repo/ui";

const RichTextViewer = dynamic(
  () => import("@repo/ui/rich-text-viewer").then((mod) => mod.RichTextViewer),
  { ssr: false },
);

type BlogArticleContentProps = {
  post: PublicBlogPost;
};

export const BlogArticleContent = ({ post }: BlogArticleContentProps) => {
  return (
    <ContentSection id="content" maxWidth="md" animated={false}>
      <RichTextViewer content={post.content} />
    </ContentSection>
  );
};
