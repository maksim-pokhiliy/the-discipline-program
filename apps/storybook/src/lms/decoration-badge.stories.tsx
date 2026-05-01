import { Chip, type ChipProps, Stack, Tooltip, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type DecorationKind = "REPLACE" | "APPEND" | "SUSPEND" | "NOTE";

type DemoDecorationBadgeProps = {
  kind: DecorationKind;
  tooltip?: string | null;
};

const KIND_TO_COLOR: Record<DecorationKind, ChipProps["color"]> = {
  REPLACE: "success",
  APPEND: "info",
  SUSPEND: "warning",
  NOTE: "info",
};

const DemoDecorationBadge = ({ kind, tooltip }: DemoDecorationBadgeProps) => {
  const color = KIND_TO_COLOR[kind];
  const chip = (
    <Chip
      size="small"
      {...(color !== undefined && { color })}
      label={kind}
      variant="filled"
      sx={{ height: 20, fontSize: 10, fontWeight: 600 }}
    />
  );

  if (!tooltip) {
    return chip;
  }

  return (
    <Tooltip title={tooltip} placement="top" arrow>
      <span>{chip}</span>
    </Tooltip>
  );
};

const meta = {
  title: "LMS/DecorationBadge",
  component: DemoDecorationBadge,
  args: { kind: "REPLACE" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoDecorationBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Replace: Story = { args: { kind: "REPLACE" } };
export const Append: Story = { args: { kind: "APPEND" } };
export const Suspend: Story = { args: { kind: "SUSPEND" } };
export const Note: Story = {
  args: { kind: "NOTE", tooltip: "Coach note: drop the load by 10% today." },
};

export const AllKinds: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="all decoration kinds — chip variant">
        <Stack direction="row" spacing={2} alignItems="center">
          <DemoDecorationBadge kind="REPLACE" />
          <Typography variant="caption">REPLACE — green outline + filled chip</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <DemoDecorationBadge kind="APPEND" />
          <Typography variant="caption">APPEND — info chip, additive entries</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <DemoDecorationBadge kind="SUSPEND" />
          <Typography variant="caption">SUSPEND — strikethrough + warning chip</Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <DemoDecorationBadge kind="NOTE" tooltip="Coach note: drop the load by 10% today." />
          <Typography variant="caption">NOTE — chip with markdown tooltip</Typography>
        </Stack>
      </StorySection>
    </StoryPage>
  ),
};
