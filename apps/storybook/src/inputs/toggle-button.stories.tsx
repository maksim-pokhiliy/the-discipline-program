import { useState } from "react";

import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/ToggleButton",
  component: ToggleButton,
  args: {
    value: "placeholder",
    children: "Toggle",
  },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const ExclusiveStory = () => {
  const [value, setValue] = useState("left");

  return (
    <StoryPage>
      <StorySection title="exclusive (single select)">
        <ToggleButtonGroup value={value} exclusive onChange={(_, v) => v && setValue(v)}>
          <ToggleButton value="left">
            <FormatAlignLeftIcon />
          </ToggleButton>
          <ToggleButton value="center">
            <FormatAlignCenterIcon />
          </ToggleButton>
          <ToggleButton value="right">
            <FormatAlignRightIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </StorySection>
    </StoryPage>
  );
};

export const Exclusive: Story = {
  render: () => <ExclusiveStory />,
};

const MultiSelectStory = () => {
  const [formats, setFormats] = useState<string[]>(["bold"]);

  return (
    <StoryPage>
      <StorySection title="multi select">
        <ToggleButtonGroup value={formats} onChange={(_, v) => setFormats(v)}>
          <ToggleButton value="bold">
            <FormatBoldIcon />
          </ToggleButton>
          <ToggleButton value="italic">
            <FormatItalicIcon />
          </ToggleButton>
          <ToggleButton value="underlined">
            <FormatUnderlinedIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </StorySection>
    </StoryPage>
  );
};

export const MultiSelect: Story = {
  render: () => <MultiSelectStory />,
};

const SizeStory = () => {
  const [small, setSmall] = useState("a");
  const [medium, setMedium] = useState("a");
  const [large, setLarge] = useState("a");

  return (
    <StoryPage>
      {(
        [
          { size: "small", value: small, set: setSmall },
          { size: "medium", value: medium, set: setMedium },
          { size: "large", value: large, set: setLarge },
        ] as const
      ).map(({ size, value, set }) => (
        <StorySection key={size} title={size}>
          <ToggleButtonGroup size={size} value={value} exclusive onChange={(_, v) => v && set(v)}>
            <ToggleButton value="a">One</ToggleButton>
            <ToggleButton value="b">Two</ToggleButton>
            <ToggleButton value="c">Three</ToggleButton>
          </ToggleButtonGroup>
        </StorySection>
      ))}
    </StoryPage>
  );
};

export const Size: Story = {
  render: () => <SizeStory />,
};

const ColorStory = () => {
  const [primary, setPrimary] = useState("a");
  const [secondary, setSecondary] = useState("a");
  const [success, setSuccess] = useState("a");
  const [error, setError] = useState("a");

  const configs = [
    { color: "primary" as const, value: primary, set: setPrimary },
    { color: "secondary" as const, value: secondary, set: setSecondary },
    { color: "success" as const, value: success, set: setSuccess },
    { color: "error" as const, value: error, set: setError },
  ];

  return (
    <StoryPage>
      {configs.map(({ color, value, set }) => (
        <StorySection key={color} title={color}>
          <ToggleButtonGroup color={color} value={value} exclusive onChange={(_, v) => v && set(v)}>
            <ToggleButton value="a">One</ToggleButton>
            <ToggleButton value="b">Two</ToggleButton>
            <ToggleButton value="c">Three</ToggleButton>
          </ToggleButtonGroup>
        </StorySection>
      ))}
    </StoryPage>
  );
};

export const Color: Story = {
  render: () => <ColorStory />,
};

const OrientationStory = () => {
  const [value, setValue] = useState("left");

  return (
    <StoryPage>
      <StorySection title="vertical">
        <ToggleButtonGroup
          orientation="vertical"
          value={value}
          exclusive
          onChange={(_, v) => v && setValue(v)}
        >
          <ToggleButton value="left">
            <FormatAlignLeftIcon />
          </ToggleButton>
          <ToggleButton value="center">
            <FormatAlignCenterIcon />
          </ToggleButton>
          <ToggleButton value="right">
            <FormatAlignRightIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </StorySection>
    </StoryPage>
  );
};

export const Orientation: Story = {
  render: () => <OrientationStory />,
};

const DisabledStory = () => {
  const [value, setValue] = useState("a");

  return (
    <StoryPage>
      <StorySection title="disabled group">
        <ToggleButtonGroup value={value} exclusive disabled onChange={(_, v) => v && setValue(v)}>
          <ToggleButton value="a">One</ToggleButton>
          <ToggleButton value="b">Two</ToggleButton>
          <ToggleButton value="c">Three</ToggleButton>
        </ToggleButtonGroup>
      </StorySection>

      <StorySection title="individual disabled">
        <ToggleButtonGroup value={value} exclusive onChange={(_, v) => v && setValue(v)}>
          <ToggleButton value="a">One</ToggleButton>
          <ToggleButton value="b" disabled>
            Two
          </ToggleButton>
          <ToggleButton value="c">Three</ToggleButton>
        </ToggleButtonGroup>
      </StorySection>
    </StoryPage>
  );
};

export const Disabled: Story = {
  render: () => <DisabledStory />,
};

const TextLabelsStory = () => {
  const [day, setDay] = useState("mon");

  return (
    <StoryPage>
      <StorySection title="text labels (schedule use case)">
        <ToggleButtonGroup value={day} exclusive onChange={(_, v) => v && setDay(v)}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <ToggleButton key={d} value={d.toLowerCase()}>
              {d}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </StorySection>
    </StoryPage>
  );
};

export const TextLabels: Story = {
  render: () => <TextLabelsStory />,
};
