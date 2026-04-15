import { useState } from "react";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { Rating, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/Rating",
  component: Rating,
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

const SIZES = ["small", "medium", "large"] as const;

export const Size: Story = {
  render: () => (
    <StoryPage>
      {SIZES.map((size) => (
        <StorySection key={size} title={size}>
          <Rating defaultValue={3} size={size} />
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const States: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="empty">
        <Rating value={0} />
      </StorySection>

      <StorySection title="filled">
        <Rating value={4} readOnly />
      </StorySection>

      <StorySection title="disabled">
        <Rating value={3} disabled />
      </StorySection>

      <StorySection title="read only">
        <Rating value={3.5} readOnly />
      </StorySection>
    </StoryPage>
  ),
};

export const Precision: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="precision={1} (default)">
        <Rating defaultValue={3} />
      </StorySection>

      <StorySection title="precision={0.5}">
        <Rating defaultValue={2.5} precision={0.5} />
      </StorySection>
    </StoryPage>
  ),
};

export const MaxStars: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="max={5} (default)">
        <Rating defaultValue={3} />
      </StorySection>

      <StorySection title="max={10}">
        <Rating defaultValue={7} max={10} />
      </StorySection>

      <StorySection title="max={3}">
        <Rating defaultValue={2} max={3} />
      </StorySection>
    </StoryPage>
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="custom icon (heart)">
        <Rating
          defaultValue={3}
          icon={<FavoriteIcon />}
          emptyIcon={<FavoriteBorderIcon />}
          sx={{ color: "error.main" }}
        />
      </StorySection>
    </StoryPage>
  ),
};

const ControlledStory = () => {
  const [value, setValue] = useState<number | null>(3);

  return (
    <StoryPage>
      <StorySection title="controlled" direction="column">
        <Rating value={value} onChange={(_, v) => setValue(v)} />
        <Stack direction="row" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Value: {value ?? "null"}
          </Typography>
        </Stack>
      </StorySection>
    </StoryPage>
  );
};

export const Controlled: Story = {
  render: () => <ControlledStory />,
};

export const HighlightSelected: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="highlightSelectedOnly">
        <Rating defaultValue={3} highlightSelectedOnly />
      </StorySection>

      <StorySection title="default (fill up to value)">
        <Rating defaultValue={3} />
      </StorySection>
    </StoryPage>
  ),
};
