import { Box, Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccentGroupCard } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/AccentGroupCard",
  component: AccentGroupCard,
  args: {
    header: null,
    children: null,
  },
} satisfies Meta<typeof AccentGroupCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Box sx={{ maxWidth: 400 }}>
      <StoryPage>
        <StorySection title="default — header + body" direction="column">
          <AccentGroupCard
            header={<Typography variant="subtitle2">Strength block — week 3</Typography>}
          >
            <Stack spacing={0.5}>
              <Typography variant="body2">Back squat — 5×3 @ 80%</Typography>
              <Typography variant="body2">Front squat — 3×5 @ 70%</Typography>
              <Typography variant="body2">Glute-ham raise — 3×8</Typography>
            </Stack>
          </AccentGroupCard>
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
