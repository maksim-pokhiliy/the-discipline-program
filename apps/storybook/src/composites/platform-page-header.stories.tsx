import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlatformPageHeader } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/PlatformPageHeader",
  component: PlatformPageHeader,
  args: {
    title: "",
  },
} satisfies Meta<typeof PlatformPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EyebrowTitle: Story = {
  render: () => (
    <StoryPage>
      <StorySection
        title="eyebrow above title — bare chrome, 28px sentence-case"
        direction="column"
      >
        <PlatformPageHeader eyebrow="Account" title="Profile" />
      </StorySection>
    </StoryPage>
  ),
};

export const WithAction: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="eyebrow + title + right action" direction="column">
        <PlatformPageHeader
          eyebrow="12 programs"
          title="Plans"
          actions={
            <Button variant="contained" startIcon={<AddIcon />}>
              New plan
            </Button>
          }
        />
      </StorySection>
    </StoryPage>
  ),
};

export const Detail: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="detail variant — back button + eyebrow + 26px title" direction="column">
        <PlatformPageHeader
          eyebrow="Training plan"
          backHref="/coach/plans"
          title="2025 Open Prep"
        />
      </StorySection>
    </StoryPage>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="title only — no eyebrow, no action" direction="column">
        <PlatformPageHeader title="Dashboard" />
      </StorySection>
    </StoryPage>
  ),
};
