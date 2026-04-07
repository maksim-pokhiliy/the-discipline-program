import { Avatar, Card, CardContent, Grid, Rating, Stack, Typography } from "@mui/material";

import { type HomePageData } from "@repo/contracts/pages";
import { ContentSection } from "@repo/ui";

interface HomeReviewsSectionProps {
  reviews: HomePageData["reviews"];
  reviewsList: HomePageData["reviewsList"];
}

export const HomeReviewsSection = ({ reviews, reviewsList }: HomeReviewsSectionProps) => {
  return (
    <ContentSection id="reviews" title={reviews.title} subtitle={reviews.subtitle}>
      <Grid container spacing={4}>
        {reviewsList.map((review) => (
          <Grid key={review.id} size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Stack spacing={4} sx={{ height: "100%" }}>
                  <Stack spacing={2} sx={{ height: "100%" }}>
                    <Rating value={review.rating} readOnly size="small" />

                    <Typography
                      variant="body1"
                      sx={{
                        flexGrow: 1,
                        fontStyle: "italic",
                      }}
                    >
                      &quot;{review.text}&quot;
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                    <Avatar src={review.authorAvatar ?? ""} alt={review.authorName} />

                    <Stack spacing={0.5}>
                      <Typography variant="body2">{review.authorName}</Typography>

                      <Typography variant="caption" color="text.secondary">
                        {review.authorRole}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </ContentSection>
  );
};
