import { Grid, Card, CardContent, Stack, Typography, Rating, Avatar, Box } from "@mui/material";
import { HomePageData } from "@repo/api";

import { ContentSection } from "@app/shared/components/ui/content-section";

interface HomeReviewsSectionProps {
  reviews: HomePageData["reviews"];
  reviewsList: HomePageData["reviewsList"];
}

export const HomeReviewsSection = ({ reviews, reviewsList }: HomeReviewsSectionProps) => {
  return (
    <ContentSection title={reviews.title} subtitle={reviews.subtitle} backgroundColor="dark">
      <Grid container spacing={4}>
        {reviewsList.map((review) => (
          <Grid key={review.id} size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: "100%", display: "flex" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                <Stack spacing={4} sx={{ height: "100%" }}>
                  <Stack spacing={2} sx={{ height: "100%" }}>
                    <Rating value={review.rating} readOnly size="small" />

                    <Typography
                      variant="body1"
                      sx={{
                        flexGrow: 1,
                        fontStyle: "italic",
                        lineHeight: 1.6,
                      }}
                    >
                      &quot;{review.text}&quot;
                    </Typography>
                  </Stack>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      src={review.authorAvatar ?? ""}
                      alt={review.authorName}
                      sx={{ width: 50, height: 50 }}
                    />

                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {review.authorName}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        {review.authorRole}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
