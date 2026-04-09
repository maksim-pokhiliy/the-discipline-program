import { useState } from "react";

import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Navigation/BottomNavigation",
  component: BottomNavigation,
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

const NAV_ITEMS = [
  { label: "Home", icon: <HomeIcon /> },
  { label: "Workouts", icon: <FitnessCenterIcon /> },
  { label: "Schedule", icon: <CalendarTodayIcon /> },
  { label: "Profile", icon: <PersonIcon /> },
];

const CONTAINER_SX = { width: 400 } as const;

const BasicStory = () => {
  const [value, setValue] = useState(0);

  return (
    <StoryPage>
      <StorySection title="basic (with labels)" direction="column">
        <Box sx={CONTAINER_SX}>
          <BottomNavigation value={value} onChange={(_, v) => setValue(v)} showLabels>
            {NAV_ITEMS.map(({ label, icon }) => (
              <BottomNavigationAction key={label} label={label} icon={icon} />
            ))}
          </BottomNavigation>
        </Box>
      </StorySection>
    </StoryPage>
  );
};

export const Basic: Story = {
  render: () => <BasicStory />,
};

const WithoutLabelsStory = () => {
  const [value, setValue] = useState(0);

  return (
    <StoryPage>
      <StorySection title="without labels (show on select)" direction="column">
        <Box sx={CONTAINER_SX}>
          <BottomNavigation value={value} onChange={(_, v) => setValue(v)}>
            {NAV_ITEMS.map(({ label, icon }) => (
              <BottomNavigationAction key={label} label={label} icon={icon} />
            ))}
          </BottomNavigation>
        </Box>
      </StorySection>
    </StoryPage>
  );
};

export const WithoutLabels: Story = {
  render: () => <WithoutLabelsStory />,
};

const ColorStory = () => {
  const [primary, setPrimary] = useState(0);
  const [secondary, setSecondary] = useState(0);

  return (
    <StoryPage>
      <StorySection title="color=primary (default)" direction="column">
        <Box sx={CONTAINER_SX}>
          <BottomNavigation value={primary} onChange={(_, v) => setPrimary(v)} showLabels>
            {NAV_ITEMS.map(({ label, icon }) => (
              <BottomNavigationAction key={label} label={label} icon={icon} />
            ))}
          </BottomNavigation>
        </Box>
      </StorySection>

      <StorySection title="color=secondary" direction="column">
        <Box sx={CONTAINER_SX}>
          <BottomNavigation value={secondary} onChange={(_, v) => setSecondary(v)} showLabels>
            {NAV_ITEMS.map(({ label, icon }) => (
              <BottomNavigationAction
                key={label}
                label={label}
                icon={icon}
                sx={{ "&.Mui-selected": { color: "secondary.main" } }}
              />
            ))}
          </BottomNavigation>
        </Box>
      </StorySection>
    </StoryPage>
  );
};

export const Color: Story = {
  render: () => <ColorStory />,
};
