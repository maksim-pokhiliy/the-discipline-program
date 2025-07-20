import { Container, Box } from "@mui/material";
import { BlogPost } from "@repo/api";
import ReactMarkdown from "react-markdown";

interface BlogArticleContentProps {
  post: BlogPost;
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
        <Box
          sx={{
            "& h2": {
              fontSize: "2rem",
              fontWeight: 600,
              marginTop: 6,
              marginBottom: 3,
              color: "text.primary",
            },
            "& h3": {
              fontSize: "1.5rem",
              fontWeight: 600,
              marginTop: 4,
              marginBottom: 2,
              color: "text.primary",
            },
            "& p": {
              fontSize: "1.125rem",
              lineHeight: 1.8,
              marginBottom: 3,
              color: "text.primary",
            },
            "& a": {
              color: "primary.main",
              textDecoration: "underline",
              fontWeight: 500,
              "&:hover": {
                color: "primary.light",
              },
            },
            "& strong": {
              fontWeight: 600,
            },
            "& em": {
              fontStyle: "italic",
            },
          }}
        >
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </Box>
      </Container>
    </Box>
  );
};
