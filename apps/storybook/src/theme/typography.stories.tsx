import "@repo/mui";
import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Theme/Typography",
  component: Typography,
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";
const SAMPLE_SHORT = "The Discipline Program";

export const CustomVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="display1" direction="column">
        <Typography variant="display1">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="display2" direction="column">
        <Typography variant="display2">{SAMPLE_SHORT}</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const Headings: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="h1" direction="column">
        <Typography variant="h1">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="h2" direction="column">
        <Typography variant="h2">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="h3" direction="column">
        <Typography variant="h3">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="h4" direction="column">
        <Typography variant="h4">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="h5" direction="column">
        <Typography variant="h5">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="h6" direction="column">
        <Typography variant="h6">{SAMPLE_SHORT}</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const Body: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="body1" direction="column">
        <Typography variant="body1">{SAMPLE_TEXT}</Typography>
      </StorySection>

      <StorySection title="body2" direction="column">
        <Typography variant="body2">{SAMPLE_TEXT}</Typography>
      </StorySection>

      <StorySection title="caption" direction="column">
        <Typography variant="caption">{SAMPLE_TEXT}</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const StockMuiVariants: Story = {
  name: "Stock MUI (no override)",
  render: () => (
    <StoryPage>
      <StorySection title="subtitle1" direction="column">
        <Typography variant="subtitle1">{SAMPLE_TEXT}</Typography>
      </StorySection>

      <StorySection title="subtitle2" direction="column">
        <Typography variant="subtitle2">{SAMPLE_TEXT}</Typography>
      </StorySection>

      <StorySection title="button" direction="column">
        <Typography variant="button">{SAMPLE_SHORT}</Typography>
      </StorySection>

      <StorySection title="overline" direction="column">
        <Typography variant="overline">{SAMPLE_SHORT}</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="all variants — scale comparison" direction="column">
        <Typography variant="display1">{SAMPLE_SHORT}</Typography>
        <Typography variant="display2">{SAMPLE_SHORT}</Typography>
        <Typography variant="h1">{SAMPLE_SHORT}</Typography>
        <Typography variant="h2">{SAMPLE_SHORT}</Typography>
        <Typography variant="h3">{SAMPLE_SHORT}</Typography>
        <Typography variant="h4">{SAMPLE_SHORT}</Typography>
        <Typography variant="h5">{SAMPLE_SHORT}</Typography>
        <Typography variant="h6">{SAMPLE_SHORT}</Typography>
        <Typography variant="subtitle1">{SAMPLE_TEXT}</Typography>
        <Typography variant="subtitle2">{SAMPLE_TEXT}</Typography>
        <Typography variant="body1">{SAMPLE_TEXT}</Typography>
        <Typography variant="body2">{SAMPLE_TEXT}</Typography>
        <Typography variant="caption">{SAMPLE_TEXT}</Typography>
        <Typography variant="button">{SAMPLE_SHORT}</Typography>
        <Typography variant="overline">{SAMPLE_SHORT}</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const FontWeights: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="fontWeight on body1" direction="column">
        <Typography fontWeight={300}>{SAMPLE_TEXT} — 300</Typography>
        <Typography fontWeight={400}>{SAMPLE_TEXT} — 400</Typography>
        <Typography fontWeight={500}>{SAMPLE_TEXT} — 500</Typography>
        <Typography fontWeight={600}>{SAMPLE_TEXT} — 600</Typography>
        <Typography fontWeight={700}>{SAMPLE_TEXT} — 700</Typography>
        <Typography fontWeight={800}>{SAMPLE_TEXT} — 800</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const Colors: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="color prop" direction="column">
        <Typography color="text.primary">{SAMPLE_TEXT} — text.primary</Typography>
        <Typography color="text.secondary">{SAMPLE_TEXT} — text.secondary</Typography>
        <Typography color="text.disabled">{SAMPLE_TEXT} — text.disabled</Typography>
        <Typography color="primary">{SAMPLE_TEXT} — primary</Typography>
        <Typography color="secondary">{SAMPLE_TEXT} — secondary</Typography>
        <Typography color="error">{SAMPLE_TEXT} — error</Typography>
        <Typography color="warning.main">{SAMPLE_TEXT} — warning.main</Typography>
        <Typography color="info.main">{SAMPLE_TEXT} — info.main</Typography>
        <Typography color="success.main">{SAMPLE_TEXT} — success.main</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const Alignment: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="textAlign" direction="column">
        <Typography align="left">{SAMPLE_TEXT} — left</Typography>
        <Typography align="center">{SAMPLE_TEXT} — center</Typography>
        <Typography align="right">{SAMPLE_TEXT} — right</Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const Truncation: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="noWrap (ellipsis)" direction="column">
        <Typography noWrap>
          {SAMPLE_TEXT} — this text should be truncated with an ellipsis when it overflows the
          container width because noWrap is enabled
        </Typography>
        <Typography variant="h4" noWrap>
          {SAMPLE_TEXT} — h4 with noWrap enabled for truncation testing
        </Typography>
      </StorySection>
    </StoryPage>
  ),
};

export const GutterBottom: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="gutterBottom" direction="column">
        <Typography variant="h3" gutterBottom>
          Heading with gutterBottom
        </Typography>
        <Typography variant="body1">
          Body text following the heading — gutterBottom adds margin below
        </Typography>
        <Typography variant="h3">Heading without gutterBottom</Typography>
        <Typography variant="body1">Body text following the heading — no extra margin</Typography>
      </StorySection>
    </StoryPage>
  ),
};
