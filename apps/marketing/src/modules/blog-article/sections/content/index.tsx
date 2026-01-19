import { Box, Container } from "@mui/material";

import { type PublicBlogPost } from "@repo/contracts/blog";
import { RichTextViewer } from "@repo/ui";

interface BlogArticleContentProps {
  post: PublicBlogPost;
}

export const BlogArticleContent = ({ post }: BlogArticleContentProps) => {
  return (
    <Box
      sx={(theme) => ({
        py: 8,
        backgroundColor: theme.palette.background.default,
      })}
    >
      <Container maxWidth="md">
        <RichTextViewer content={post.content} />
      </Container>
    </Box>
  );
};
