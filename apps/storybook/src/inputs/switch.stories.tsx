import { useState } from "react";

import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = ["primary", "secondary", "error", "warning", "info", "success", "default"] as const;
const SIZES = ["small", "medium"] as const;

export const SizeByColor: Story = {
  render: () => (
    <StoryPage>
      {SIZES.map((size) => (
        <StorySection key={size} title={size}>
          {COLORS.map((color) => (
            <FormControlLabel
              key={color}
              label={color}
              control={<Switch defaultChecked size={size} color={color} />}
            />
          ))}
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const States: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="unchecked">
        <Switch />
      </StorySection>

      <StorySection title="checked">
        <Switch defaultChecked />
      </StorySection>

      <StorySection title="disabled unchecked">
        <Switch disabled />
      </StorySection>

      <StorySection title="disabled checked">
        <Switch disabled defaultChecked />
      </StorySection>
    </StoryPage>
  ),
};

const WithLabelsStory = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  return (
    <StoryPage>
      <StorySection title="with FormControlLabel" direction="column">
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={notifications} onChange={(_, v) => setNotifications(v)} />}
            label="Push notifications"
          />
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={(_, v) => setDarkMode(v)} />}
            label="Dark mode"
          />
          <FormControlLabel
            control={<Switch checked={autoSave} onChange={(_, v) => setAutoSave(v)} />}
            label="Auto-save workouts"
          />
          <FormControlLabel control={<Switch disabled />} label="Premium only (disabled)" />
        </FormGroup>
      </StorySection>
    </StoryPage>
  );
};

export const WithLabels: Story = {
  render: () => <WithLabelsStory />,
};

export const LabelPlacement: Story = {
  render: () => (
    <StoryPage>
      {(["end", "start", "top", "bottom"] as const).map((placement) => (
        <StorySection key={placement} title={placement}>
          <FormControlLabel
            labelPlacement={placement}
            control={<Switch defaultChecked />}
            label={placement}
          />
        </StorySection>
      ))}
    </StoryPage>
  ),
};
