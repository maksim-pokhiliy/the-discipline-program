import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = ["primary", "secondary", "error", "warning", "info", "success", "inherit"] as const;
const SIZES = ["small", "medium", "large"] as const;
const VARIANTS = ["contained", "outlined", "text"] as const;

export const VariantByColor: Story = {
  render: () => (
    <StoryPage>
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant}>
          {COLORS.map((color) => (
            <Button key={color} variant={variant} color={color}>
              {color}
            </Button>
          ))}
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const VariantBySize: Story = {
  render: () => (
    <StoryPage>
      {VARIANTS.map((variant) => (
        <StorySection key={variant} title={variant}>
          {SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {size}
            </Button>
          ))}
        </StorySection>
      ))}
    </StoryPage>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="startIcon">
        <Button variant="contained" startIcon={<AddIcon />}>
          Add
        </Button>
        <Button variant="outlined" startIcon={<SaveIcon />}>
          Save
        </Button>
        <Button variant="text" startIcon={<DeleteIcon />} color="error">
          Delete
        </Button>
      </StorySection>

      <StorySection title="endIcon">
        <Button variant="contained" endIcon={<AddIcon />}>
          Add
        </Button>
        <Button variant="outlined" endIcon={<SaveIcon />}>
          Save
        </Button>
      </StorySection>

      <StorySection title="icon sizes">
        {SIZES.map((size) => (
          <Button key={size} variant="contained" size={size} startIcon={<AddIcon />}>
            {size}
          </Button>
        ))}
      </StorySection>
    </StoryPage>
  ),
};

export const States: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="disabled">
        <Button variant="contained" disabled>
          Contained
        </Button>
        <Button variant="outlined" disabled>
          Outlined
        </Button>
        <Button variant="text" disabled>
          Text
        </Button>
      </StorySection>

      <StorySection title="fullWidth" direction="column">
        <Button variant="contained" fullWidth>
          Full Width Contained
        </Button>
        <Button variant="outlined" fullWidth>
          Full Width Outlined
        </Button>
      </StorySection>
    </StoryPage>
  ),
};
