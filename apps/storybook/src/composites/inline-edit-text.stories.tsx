import { useState } from "react";

import { Stack, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InlineEditText } from "@repo/ui";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Composites/InlineEditText",
  component: InlineEditText,
  args: {
    value: "",
    onCommit: () => {},
    variant: "h1",
    ariaLabel: "Editable text",
  },
} satisfies Meta<typeof InlineEditText>;

export default meta;
type Story = StoryObj<typeof meta>;

const SingleLineStory = ({ initial }: { initial: string }) => {
  const [value, setValue] = useState(initial);

  return (
    <InlineEditText
      value={value}
      onCommit={(next) => setValue(next)}
      variant="h1"
      ariaLabel="Title"
    />
  );
};

export const Default: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="single-line h1 — blur or enter commits" direction="column">
        <SingleLineStory initial="Plan title" />
      </StorySection>
    </StoryPage>
  ),
};

export const WithPlaceholder: Story = {
  render: () => {
    const PlaceholderStory = () => {
      const [value, setValue] = useState("");

      return (
        <InlineEditText
          value={value}
          onCommit={(next) => setValue(next)}
          variant="body1"
          ariaLabel="Description"
          placeholder="Add a description…"
          emptyIsValid
        />
      );
    };

    return (
      <StoryPage>
        <StorySection title="placeholder — body1 with emptyIsValid" direction="column">
          <PlaceholderStory />
        </StorySection>
      </StoryPage>
    );
  },
};

export const Multiline: Story = {
  render: () => {
    const MultilineStory = () => {
      const [value, setValue] = useState("First line.\nSecond line with detail.");

      return (
        <InlineEditText
          value={value}
          onCommit={(next) => setValue(next)}
          variant="body2"
          ariaLabel="Day notes"
          multiline
          emptyIsValid
          placeholder="day note (cues, focus)…"
        />
      );
    };

    return (
      <StoryPage>
        <StorySection title="multiline body2 — enter inserts newline" direction="column">
          <MultilineStory />
        </StorySection>
      </StoryPage>
    );
  },
};

export const MaxLength: Story = {
  render: () => {
    const MAX = 24;
    const MaxLengthStory = () => {
      const [value, setValue] = useState("short text");

      return (
        <Stack spacing={1}>
          <InlineEditText
            value={value}
            onCommit={(next) => setValue(next)}
            variant="h4"
            ariaLabel="Truncated title"
            maxLength={MAX}
          />
          <Typography variant="caption" color="text.secondary">
            {value.length} / {MAX} chars
          </Typography>
        </Stack>
      );
    };

    return (
      <StoryPage>
        <StorySection title="maxLength enforced via inputProps" direction="column">
          <MaxLengthStory />
        </StorySection>
      </StoryPage>
    );
  },
};

export const EmptyRejected: Story = {
  render: () => {
    const EmptyRejectedStory = () => {
      const [value, setValue] = useState("Required title");

      return (
        <InlineEditText
          value={value}
          onCommit={(next) => setValue(next)}
          variant="h1"
          ariaLabel="Required title"
        />
      );
    };

    return (
      <StoryPage>
        <StorySection title="emptyIsValid false — blur with empty reverts" direction="column">
          <EmptyRejectedStory />
        </StorySection>
      </StoryPage>
    );
  },
};
