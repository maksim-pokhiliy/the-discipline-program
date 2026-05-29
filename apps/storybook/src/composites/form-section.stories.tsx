import { Stack, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FormSection } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const COMPONENT_DESCRIPTION = [
  "Labelled form section matching the prototype `.form-section` — uppercase `.form-lbl` label, optional em-dash-prefixed italic `.form-helper`, and a body slot.",
  'Replaces the bare `Typography variant="subtitle2"` section headers in the Edit Block modal.',
  "Introduced in C9 for the Edit Block modal (Intensity / Time cap / Block notes).",
].join(" ");

const RPE_VALUES = [7, 8, 9] as const;

const noop = (): void => undefined;

const meta = {
  title: "Composites/FormSection",
  component: FormSection,
  args: {
    label: "Block notes",
    helper: "coaching cues, intent",
    children: null,
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
  },
} satisfies Meta<typeof FormSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHelper: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="label + helper + body" direction="column">
        <FormSection label="Block notes" helper="coaching cues, intent">
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder='e.g. "Build to a heavy 5. Slow ascent, no missed reps."'
          />
        </FormSection>
      </StorySection>
    </StoryPage>
  ),
};

export const WithoutHelper: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="label + body (no helper)" direction="column">
        <FormSection label="Time cap">
          <Stack direction="row" spacing={1}>
            <TextField size="small" type="number" placeholder="min" />
            <TextField size="small" type="number" placeholder="max" />
          </Stack>
        </FormSection>
      </StorySection>
    </StoryPage>
  ),
};

export const WithSegmentedBody: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="label + helper + segmented body" direction="column">
        <FormSection label="Intensity — any combination of axes" helper="rpe">
          <ToggleButtonGroup exclusive size="small" value={8} onChange={noop}>
            {RPE_VALUES.map((value) => (
              <ToggleButton key={value} value={value}>
                {value}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FormSection>
      </StorySection>
    </StoryPage>
  ),
};
