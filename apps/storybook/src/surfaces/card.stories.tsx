import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Surfaces/Card",
  component: Card,
  args: {
    children: undefined,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <Box sx={{ maxWidth: 400 }}>
      <StoryPage>
        <StorySection title="elevation (default)" direction="column">
          <Card>
            <CardContent>
              <Typography variant="h5">Elevation Card</Typography>
              <Typography variant="body2" color="text.secondary">
                Default variant with elevation.
              </Typography>
            </CardContent>
          </Card>
        </StorySection>

        <StorySection title="outlined" direction="column">
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5">Outlined Card</Typography>
              <Typography variant="body2" color="text.secondary">
                Card with border, no elevation.
              </Typography>
            </CardContent>
          </Card>
        </StorySection>

        <StorySection title="with header" direction="column">
          <Card variant="outlined">
            <CardHeader title="Card Title" subheader="Card Subheader" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Card with a CardHeader component.
              </Typography>
            </CardContent>
          </Card>
        </StorySection>

        <StorySection title="with actions" direction="column">
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5">Card with Actions</Typography>
              <Typography variant="body2" color="text.secondary">
                Card with action buttons at the bottom.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Learn More</Button>
              <Button size="small" variant="contained">
                Action
              </Button>
            </CardActions>
          </Card>
        </StorySection>

        <StorySection title="with media" direction="column">
          <Card variant="outlined">
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"
              alt="Gym"
            />
            <CardContent>
              <Typography variant="h5">Media Card</Typography>
              <Typography variant="body2" color="text.secondary">
                Card with an image at the top.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Share</Button>
              <Button size="small">Learn More</Button>
            </CardActions>
          </Card>
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
