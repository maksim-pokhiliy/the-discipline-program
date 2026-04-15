import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Surfaces/App Bar",
  component: AppBar,
  args: {
    children: undefined,
  },
} satisfies Meta<typeof AppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="default" direction="column">
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="Menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              App Title
            </Typography>
            <IconButton color="inherit" aria-label="Search">
              <SearchIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </StorySection>

      <StorySection title="color=default" direction="column">
        <AppBar position="static" color="default">
          <Toolbar>
            <Typography variant="h6">Default Color</Typography>
          </Toolbar>
        </AppBar>
      </StorySection>

      <StorySection title="color=transparent" direction="column">
        <AppBar position="static" color="transparent">
          <Toolbar>
            <Typography variant="h6">Transparent</Typography>
          </Toolbar>
        </AppBar>
      </StorySection>

      <StorySection title="dense toolbar" direction="column">
        <AppBar position="static">
          <Toolbar variant="dense">
            <IconButton edge="start" color="inherit" size="small" aria-label="Menu">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "right" }}>
              Dense
            </Typography>
          </Toolbar>
        </AppBar>
      </StorySection>
    </StoryPage>
  ),
};
