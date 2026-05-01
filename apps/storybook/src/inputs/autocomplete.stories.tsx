import { Autocomplete, type AutocompleteRenderInputParams, Chip, TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type AutocompleteTextFieldProps = AutocompleteRenderInputParams & {
  label?: string | undefined;
};

const AutocompleteTextField = ({
  size,
  InputLabelProps,
  InputProps,
  inputProps,
  label,
  ...rest
}: AutocompleteTextFieldProps) => (
  <TextField
    {...rest}
    {...(size !== undefined && { size })}
    {...(label !== undefined && { label })}
    slotProps={{
      input: InputProps,
      inputLabel: InputLabelProps,
      htmlInput: inputProps,
    }}
  />
);

const meta = {
  title: "Inputs/Autocomplete",
  component: Autocomplete,
  args: {
    options: [],
    renderInput: (params) => <AutocompleteTextField {...params} />,
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

const EXERCISES = [
  "Back Squat",
  "Front Squat",
  "Deadlift",
  "Clean & Jerk",
  "Snatch",
  "Bench Press",
  "Overhead Press",
  "Pull Up",
  "Muscle Up",
  "Handstand Push Up",
];

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="single select" direction="column">
        <Autocomplete
          options={EXERCISES}
          renderInput={(params) => <AutocompleteTextField {...params} label="Exercise" />}
        />
      </StorySection>

      <StorySection title="multiple select" direction="column">
        <Autocomplete
          multiple
          options={EXERCISES}
          defaultValue={[EXERCISES[0], EXERCISES[3]].filter(Boolean)}
          renderInput={(params) => <AutocompleteTextField {...params} label="Exercises" />}
        />
      </StorySection>

      <StorySection title="multiple with chips" direction="column">
        <Autocomplete
          multiple
          options={EXERCISES}
          defaultValue={[EXERCISES[1], EXERCISES[4]].filter(Boolean)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => <AutocompleteTextField {...params} label="With Chips" />}
        />
      </StorySection>

      <StorySection title="disabled" direction="column">
        <Autocomplete
          disabled
          options={EXERCISES}
          value={EXERCISES[0]}
          renderInput={(params) => <AutocompleteTextField {...params} label="Disabled" />}
        />
      </StorySection>

      <StorySection title="sizes" direction="column">
        <Autocomplete
          size="small"
          options={EXERCISES}
          renderInput={(params) => <AutocompleteTextField {...params} label="Small" />}
        />
        <Autocomplete
          options={EXERCISES}
          renderInput={(params) => <AutocompleteTextField {...params} label="Medium (default)" />}
        />
      </StorySection>

      <StorySection title="freeSolo (custom input)" direction="column">
        <Autocomplete
          freeSolo
          options={EXERCISES}
          renderInput={(params) => <AutocompleteTextField {...params} label="Type or select" />}
        />
      </StorySection>
    </StoryPage>
  ),
};
