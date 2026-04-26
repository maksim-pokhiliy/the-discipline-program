import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  type SchemeArchetypeKind,
  type SchemeParams,
  defaultSchemeParams,
} from "@repo/contracts/lms/_domain";
import { SchemeForm } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

type ControlledArgs = {
  archetypeKind: SchemeArchetypeKind;
};

const ControlledForm = ({ archetypeKind }: ControlledArgs) => {
  const [params, setParams] = useState<SchemeParams>(() => defaultSchemeParams(archetypeKind));

  return (
    <SchemeForm
      archetypeKind={archetypeKind}
      schemeParams={params}
      onChange={(next) => setParams(next)}
    />
  );
};

const meta = {
  title: "LMS/SchemeForm",
  component: ControlledForm,
  args: {
    archetypeKind: "COUNT_DOWN",
  },
} satisfies Meta<typeof ControlledForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const None: Story = { args: { archetypeKind: "NONE" } };
export const CountUp: Story = { args: { archetypeKind: "COUNT_UP" } };
export const CountDown: Story = { args: { archetypeKind: "COUNT_DOWN" } };
export const IntervalLoop: Story = { args: { archetypeKind: "INTERVAL_LOOP" } };
export const EmomLoop: Story = { args: { archetypeKind: "EMOM_LOOP" } };
export const TimeBoxed: Story = { args: { archetypeKind: "TIME_BOXED" } };

export const AllArchetypes: Story = {
  render: () => (
    <StoryPage>
      {(
        [
          "NONE",
          "COUNT_UP",
          "COUNT_DOWN",
          "INTERVAL_LOOP",
          "EMOM_LOOP",
          "TIME_BOXED",
        ] satisfies SchemeArchetypeKind[]
      ).map((kind) => (
        <StorySection key={kind} title={kind} direction="column">
          <ControlledForm archetypeKind={kind} />
        </StorySection>
      ))}
    </StoryPage>
  ),
};
