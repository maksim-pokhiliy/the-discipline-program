import { useState } from "react";

import { Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ToggleSection } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/ToggleSection",
  component: ToggleSection,
  args: {
    on: false,
    label: "",
    children: null,
  },
} satisfies Meta<typeof ToggleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="on — with helper + body" direction="column">
        <ToggleSection on label="Schema active" helper="2 of 5 exercises configured">
          <Typography variant="body2">Body content rendered while on.</Typography>
        </ToggleSection>
      </StorySection>
    </StoryPage>
  ),
};

export const Off: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="off — header only" direction="column">
        <ToggleSection on={false} label="Schema disabled">
          <Typography variant="body2">Hidden body.</Typography>
        </ToggleSection>
      </StorySection>
    </StoryPage>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="disabled — pending mutation" direction="column">
        <ToggleSection
          on
          label="Disabled while on"
          helper="head dimmed, body non-interactive"
          onToggle={() => undefined}
          disabled
        >
          <Typography variant="body2">Body greyed and non-interactive.</Typography>
        </ToggleSection>

        <ToggleSection
          on={false}
          label="Disabled while off"
          helper="head dimmed, click suppressed"
          onToggle={() => undefined}
          disabled
        >
          <Typography variant="body2">Hidden body.</Typography>
        </ToggleSection>
      </StorySection>
    </StoryPage>
  ),
};

const InteractiveStory = () => {
  const [on, setOn] = useState(true);

  return (
    <StoryPage>
      <StorySection title="interactive — click header to toggle" direction="column">
        <ToggleSection
          on={on}
          label="Toggleable schema"
          helper={on ? "click to disable" : "click to enable"}
          onToggle={() => setOn((value) => !value)}
        >
          <Typography variant="body2">
            Body visible while on. Current state: {on ? "on" : "off"}.
          </Typography>
        </ToggleSection>
      </StorySection>
    </StoryPage>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveStory />,
};
