import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/TextField",
  component: TextField,
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Variant: Story = {
  render: () => (
    <StoryPage>
      {(["outlined", "filled", "standard"] as const).map((variant) => (
        <StorySection key={variant} title={variant} direction="column">
          <TextField variant={variant} label="Label" defaultValue="Value" />
          <TextField variant={variant} label="Empty" />
          <TextField variant={variant} label="Placeholder" placeholder="Type here..." />
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const Size: Story = {
  render: () => (
    <StoryPage>
      {(["small", "medium"] as const).map((size) => (
        <StorySection key={size} title={size} direction="column">
          <TextField size={size} label="Label" defaultValue="Value" />
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const States: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="disabled" direction="column">
        <TextField label="Disabled" defaultValue="Cannot edit" disabled />
      </StorySection>

      <StorySection title="read only" direction="column">
        <TextField
          label="Read Only"
          defaultValue="Cannot edit"
          slotProps={{ input: { readOnly: true } }}
        />
      </StorySection>

      <StorySection title="error" direction="column">
        <TextField label="Error" defaultValue="Wrong value" error />
        <TextField
          label="Error + helper"
          defaultValue="Wrong value"
          error
          helperText="This field is required"
        />
      </StorySection>
    </StoryPage>
  ),
};

export const HelperText: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="helper text" direction="column">
        <TextField label="Name" helperText="Enter your full name" />
        <TextField label="Email" error helperText="Invalid email address" />
      </StorySection>
    </StoryPage>
  ),
};

export const Multiline: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="multiline" direction="column">
        <TextField label="Notes" multiline rows={3} placeholder="Write your notes here..." />
        <TextField
          label="Auto-grow"
          multiline
          minRows={2}
          maxRows={6}
          placeholder="Grows as you type..."
        />
      </StorySection>
    </StoryPage>
  ),
};

export const Adornments: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="start adornment" direction="column">
        <TextField
          label="Search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="Amount"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            },
          }}
        />
      </StorySection>

      <StorySection title="end adornment" direction="column">
        <TextField
          label="Weight"
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            },
          }}
        />
        <TextField
          label="Password"
          type="password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" size="small">
                    <VisibilityIcon />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </StorySection>
    </StoryPage>
  ),
};

export const Select: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="select" direction="column">
        <TextField label="Category" select defaultValue="strength">
          <MenuItem value="strength">Strength</MenuItem>
          <MenuItem value="cardio">Cardio</MenuItem>
          <MenuItem value="mobility">Mobility</MenuItem>
          <MenuItem value="skill">Skill</MenuItem>
        </TextField>
      </StorySection>

      <StorySection title="select small" direction="column">
        <TextField label="Category" select size="small" defaultValue="strength">
          <MenuItem value="strength">Strength</MenuItem>
          <MenuItem value="cardio">Cardio</MenuItem>
          <MenuItem value="mobility">Mobility</MenuItem>
        </TextField>
      </StorySection>
    </StoryPage>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="fullWidth (default in override)" direction="column">
        <TextField label="Full Width" />
      </StorySection>

      <StorySection title="not fullWidth">
        <TextField label="Fixed" fullWidth={false} />
        <TextField label="Fixed" fullWidth={false} />
      </StorySection>
    </StoryPage>
  ),
};

export const Types: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="input types" direction="column">
        <TextField label="Text" type="text" defaultValue="Hello" />
        <TextField label="Number" type="number" defaultValue={100} />
        <TextField label="Email" type="email" placeholder="user@example.com" />
        <TextField label="Password" type="password" defaultValue="secret" />
        <TextField label="Date" type="date" slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Time" type="time" slotProps={{ inputLabel: { shrink: true } }} />
      </StorySection>
    </StoryPage>
  ),
};
