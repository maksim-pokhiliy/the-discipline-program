import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Link, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PageHeader } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/PageHeader",
  component: PageHeader,
  args: {
    title: "",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="bare title — card chrome + h1 typography" direction="column">
        <PageHeader title="Profile" />
      </StorySection>
    </StoryPage>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="title + description — display mode" direction="column">
        <PageHeader
          title="Athletes"
          description="Manage your roster of athletes assigned to training plans."
        />
      </StorySection>
    </StoryPage>
  ),
};

export const Editable: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="editable — borderless inputbase title + description" direction="column">
        <PageHeader
          editable
          title="Training plan"
          description="Click to edit"
          onTitleCommit={() => {}}
          onDescriptionCommit={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const WithActions: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="title + actions slot — right-aligned" direction="column">
        <PageHeader
          title="Training Plans"
          actions={
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Plan
            </Button>
          }
        />
      </StorySection>
    </StoryPage>
  ),
};

export const WithMeta: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="title + meta row — athletes count + link" direction="column">
        <PageHeader
          title="2025 Open Prep"
          meta={
            <>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                  3
                </Box>{" "}
                athletes assigned
              </Typography>
              <Typography variant="body2" color="text.faint">
                ·
              </Typography>
              <Link component="button" sx={{ color: "primary.main" }}>
                view athletes
              </Link>
            </>
          }
        />
      </StorySection>
    </StoryPage>
  ),
};

export const LongTitleWithActions: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="long title — nowrap ellipsis + actions stay right" direction="column">
        <PageHeader
          title="A very long training plan title that should overflow with ellipsis at narrow widths"
          actions={<Button variant="outlined">Edit</Button>}
        />
      </StorySection>
    </StoryPage>
  ),
};
