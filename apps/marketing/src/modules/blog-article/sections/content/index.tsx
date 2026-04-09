import { type PublicBlogPost } from "@repo/contracts/blog";
import { ContentSection, RichTextViewer } from "@repo/ui";

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
