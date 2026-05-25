import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { type Label } from "@repo/contracts/lms/label";
import { LabelPickerChip } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const baseDate = new Date("2025-01-01T00:00:00.000Z");

const buildLabel = (overrides: Partial<Label>): Label => ({
  id: "label-id",
  name: "Label",
  nameLower: "label",
  applicableLevels: ["DAY"],
  notes: null,
  rest: false,
  createdAt: baseDate,
  updatedAt: baseDate,
  ...overrides,
});

const DAY_OPTIONS: Label[] = [
  buildLabel({ id: "day-main", name: "MAIN" }),
  buildLabel({ id: "day-skill", name: "SKILL" }),
  buildLabel({ id: "day-strength", name: "STRENGTH" }),
  buildLabel({ id: "day-rest", name: "REST DAY", rest: true }),
];

const REST_OPTION = DAY_OPTIONS[3];
const MAIN_OPTION = DAY_OPTIONS[0];

const meta = {
  title: "Composites/LabelPickerChip",
  component: LabelPickerChip,
  args: {
    value: null,
    options: DAY_OPTIONS,
    level: "DAY",
    onChange: () => {},
  },
} satisfies Meta<typeof LabelPickerChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="default — no value selected" direction="row">
        <LabelPickerChip value={null} options={DAY_OPTIONS} level="DAY" onChange={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};

export const Selected: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="selected — non-rest label" direction="row">
        <LabelPickerChip
          value={MAIN_OPTION ?? null}
          options={DAY_OPTIONS}
          level="DAY"
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const RestSelected: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="rest selected — orange tonal variant" direction="row">
        <LabelPickerChip
          value={REST_OPTION ?? null}
          options={DAY_OPTIONS}
          level="DAY"
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

const InteractiveStory = () => {
  const [value, setValue] = useState<Label | null>(null);
  const handleChange = (labelId: string | null) => {
    if (labelId === null) {
      setValue(null);

      return;
    }

    const next = DAY_OPTIONS.find((option) => option.id === labelId);

    setValue(next ?? null);
  };

  return (
    <StoryPage>
      <StorySection title="interactive — click to open menu" direction="row">
        <LabelPickerChip value={value} options={DAY_OPTIONS} level="DAY" onChange={handleChange} />
      </StorySection>
    </StoryPage>
  );
};

export const Interactive: Story = {
  render: () => <InteractiveStory />,
};

export const Empty: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="empty — no options available" direction="row">
        <LabelPickerChip value={null} options={[]} level="DAY" onChange={() => {}} />
      </StorySection>
    </StoryPage>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="loading — menu blocked until options arrive" direction="row">
        <LabelPickerChip
          value={null}
          options={DAY_OPTIONS}
          level="DAY"
          isLoading
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="disabled — chip + menu blocked" direction="row">
        <LabelPickerChip
          value={MAIN_OPTION ?? null}
          options={DAY_OPTIONS}
          level="DAY"
          disabled
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};
