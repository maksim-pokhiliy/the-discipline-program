import { type PublicBlogPost } from "@repo/contracts/blog";
import { type BlogPageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

import { BlogPostCard } from "@app/lib/components/ui";

type BlogFeaturedSectionProps = {
  hero: BlogPageData["hero"];
  featuredPost: PublicBlogPost;
};

export const BlogFeaturedSection = ({ hero, featuredPost }: BlogFeaturedSectionProps) => {
  return (
    <ContentSection id="featured" title={hero.title} subtitle={hero.subtitle} offset={1}>
      <BlogPostCard
        slug={featuredPost.slug}
        title={featuredPost.title}
        excerpt={featuredPost.excerpt}
        coverImage={featuredPost.coverImage}
        readTime={featuredPost.readTime}
        category={featuredPost.category}
        authorName={featuredPost.authorName}
        variant="featured"
      />
    </ContentSection>
  );
};
