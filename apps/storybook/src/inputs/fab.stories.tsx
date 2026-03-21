import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import NavigationIcon from "@mui/icons-material/Navigation";
import { Fab } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Inputs/Fab",
  component: Fab,
  args: {
    children: <AddIcon />,
  },
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

const COLORS = ["primary", "secondary", "error", "info", "success", "warning", "inherit"] as const;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="colors">
        {COLORS.map((color) => (
          <Fab key={color} color={color}>
            <AddIcon />
          </Fab>
        ))}
      </StorySection>

      <StorySection title="sizes">
        <Fab size="small">
          <AddIcon />
        </Fab>
        <Fab size="medium">
          <AddIcon />
        </Fab>
        <Fab size="large">
          <AddIcon />
        </Fab>
      </StorySection>

      <StorySection title="extended">
        <Fab variant="extended" size="small">
          <NavigationIcon /> Navigate
        </Fab>
        <Fab variant="extended" size="medium">
          <EditIcon /> Edit
        </Fab>
        <Fab variant="extended" size="large">
          <AddIcon /> Create
        </Fab>
      </StorySection>

      <StorySection title="disabled">
        <Fab disabled>
          <AddIcon />
        </Fab>
        <Fab variant="extended" disabled>
          <AddIcon /> Disabled
        </Fab>
      </StorySection>
    </StoryPage>
  ),
};
