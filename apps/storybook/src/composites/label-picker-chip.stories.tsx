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

const dayOpt = buildLabel({ id: "day-1", name: "STRENGTH", applicableLevels: ["BLOCK"] });
const restOpt = buildLabel({ id: "day-2", name: "ACCESSORY", applicableLevels: ["BLOCK"] });
const skillOpt = buildLabel({ id: "day-3", name: "SKILL", applicableLevels: ["BLOCK"] });
const BLOCK_OPTIONS: Label[] = [dayOpt, restOpt, skillOpt];

const COMPONENT_DESCRIPTION = [
  "LabelPickerChip is a discriminated `Single | Multi` composite mirroring the prop shape of `@repo/ui/label-select`.",
  "Single mode renders one tonal chip with a Menu trigger (today's DAY/SESSION usage).",
  'Multi mode renders N `BlockLabel` chips plus a `+ label` trigger built on the new `MuiButton size="tiny"` variant — used by BLOCK-level rows that accept several labels.',
].join(" ");

const meta = {
  title: "Composites/LabelPickerChip",
  component: LabelPickerChip,
  args: {
    value: null,
    options: DAY_OPTIONS,
    level: "DAY",
    onChange: () => {},
  },
  parameters: {
    docs: {
      description: {
        component: COMPONENT_DESCRIPTION,
      },
    },
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

export const MultiEmpty: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="multi · empty — trigger only, no chips" direction="row">
        <LabelPickerChip
          multiple
          value={[]}
          options={BLOCK_OPTIONS}
          level="BLOCK"
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const MultiPartial: Story = {
  render: () => {
    const MultiPartialStory = () => {
      const [value, setValue] = useState<Label[]>([dayOpt]);
      const handleChange = (labelIds: string[]) => {
        const next = labelIds
          .map((id) => BLOCK_OPTIONS.find((option) => option.id === id))
          .filter((option): option is Label => option !== undefined);

        setValue(next);
      };

      return (
        <LabelPickerChip
          multiple
          value={value}
          options={BLOCK_OPTIONS}
          level="BLOCK"
          onChange={handleChange}
        />
      );
    };

    return (
      <StoryPage>
        <StorySection title="multi · partial — one chip + trigger" direction="row">
          <MultiPartialStory />
        </StorySection>
      </StoryPage>
    );
  },
};

export const MultiAllSelected: Story = {
  render: () => {
    const MultiAllSelectedStory = () => {
      const [value, setValue] = useState<Label[]>([dayOpt, restOpt, skillOpt]);
      const handleChange = (labelIds: string[]) => {
        const next = labelIds
          .map((id) => BLOCK_OPTIONS.find((option) => option.id === id))
          .filter((option): option is Label => option !== undefined);

        setValue(next);
      };

      return (
        <LabelPickerChip
          multiple
          value={value}
          options={BLOCK_OPTIONS}
          level="BLOCK"
          onChange={handleChange}
        />
      );
    };

    return (
      <StoryPage>
        <StorySection
          title="multi · all selected — three chips, trigger opens 'All labels added.' disabled item"
          direction="row"
        >
          <MultiAllSelectedStory />
        </StorySection>
      </StoryPage>
    );
  },
};

export const MultiDisabled: Story = {
  render: () => (
    <StoryPage>
      <StorySection
        title="multi · disabled — chips without delete, trigger blocked"
        direction="row"
      >
        <LabelPickerChip
          multiple
          value={[dayOpt, restOpt]}
          options={BLOCK_OPTIONS}
          level="BLOCK"
          disabled
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const MultiLoading: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="multi · loading — inline spinner replaces trigger" direction="row">
        <LabelPickerChip
          multiple
          value={[]}
          options={BLOCK_OPTIONS}
          level="BLOCK"
          isLoading
          onChange={() => {}}
        />
      </StorySection>
    </StoryPage>
  ),
};
