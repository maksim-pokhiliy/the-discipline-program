import { useState } from "react";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import { Box, Tab, Tabs, type TabsProps } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const LABELS = ["Workouts", "Athletes", "Programs", "Settings"];
const ICONS = [
  <FitnessCenterIcon key="fit" />,
  <PersonIcon key="person" />,
  <FavoriteIcon key="fav" />,
  <SettingsIcon key="settings" />,
];

const useTabs = () => {
  const [value, setValue] = useState(0);
  const bind: Pick<TabsProps, "value" | "onChange"> = {
    value,
    onChange: (_, v) => setValue(v),
  };

  return bind;
};

const TextColorStory = () => {
  const primary = useTabs();
  const secondary = useTabs();
  const inherit = useTabs();
  const configs = [
    { color: "primary" as const, bind: primary },
    { color: "secondary" as const, bind: secondary },
    { color: "inherit" as const, bind: inherit },
  ];

  return (
    <StoryPage>
      {configs.map(({ color, bind }) => (
        <StorySection key={color} title={`textColor="${color}"`} direction="column">
          <Tabs
            {...bind}
            textColor={color}
            indicatorColor={color === "inherit" ? "primary" : color}
          >
            {LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </StorySection>
      ))}
    </StoryPage>
  );
};

export const TextColor: Story = {
  render: () => <TextColorStory />,
};

const VariantStory = () => {
  const standard = useTabs();
  const scrollable = useTabs();
  const fullWidth = useTabs();
  const configs = [
    { variant: "standard" as const, bind: standard },
    { variant: "scrollable" as const, bind: scrollable },
    { variant: "fullWidth" as const, bind: fullWidth },
  ];

  return (
    <StoryPage>
      {configs.map(({ variant, bind }) => (
        <StorySection key={variant} title={variant} direction="column">
          <Tabs {...bind} variant={variant}>
            {LABELS.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </StorySection>
      ))}
    </StoryPage>
  );
};

export const Variant: Story = {
  render: () => <VariantStory />,
};

const WithIconsStory = () => {
  const start = useTabs();
  const iconOnly = useTabs();
  const top = useTabs();
  const end = useTabs();

  return (
    <StoryPage>
      <StorySection title="icon + label (start)" direction="column">
        <Tabs {...start}>
          {LABELS.map((label, i) => {
            const icon = ICONS[i];

            return (
              <Tab
                key={label}
                label={label}
                {...(icon !== undefined && { icon })}
                iconPosition="start"
              />
            );
          })}
        </Tabs>
      </StorySection>

      <StorySection title="icon only" direction="column">
        <Tabs {...iconOnly}>
          {ICONS.map((icon, i) => (
            <Tab key={i} icon={icon} />
          ))}
        </Tabs>
      </StorySection>

      <StorySection title="icon top (default)" direction="column">
        <Tabs {...top}>
          {LABELS.map((label, i) => {
            const icon = ICONS[i];

            return <Tab key={label} label={label} {...(icon !== undefined && { icon })} />;
          })}
        </Tabs>
      </StorySection>

      <StorySection title="icon end" direction="column">
        <Tabs {...end}>
          {LABELS.map((label, i) => {
            const icon = ICONS[i];

            return (
              <Tab
                key={label}
                label={label}
                {...(icon !== undefined && { icon })}
                iconPosition="end"
              />
            );
          })}
        </Tabs>
      </StorySection>
    </StoryPage>
  );
};

export const WithIcons: Story = {
  render: () => <WithIconsStory />,
};

const DisabledStory = () => {
  const bind = useTabs();

  return (
    <StoryPage>
      <StorySection title="individual disabled" direction="column">
        <Tabs {...bind}>
          <Tab label="Active" />
          <Tab label="Disabled" disabled />
          <Tab label="Active" />
          <Tab label="Disabled" disabled />
        </Tabs>
      </StorySection>
    </StoryPage>
  );
};

export const Disabled: Story = {
  render: () => <DisabledStory />,
};

const ScrollableStory = () => {
  const bind = useTabs();

  return (
    <StoryPage>
      <StorySection title="scrollable (many tabs)" direction="column">
        <Box sx={{ maxWidth: 400 }}>
          <Tabs {...bind} variant="scrollable" scrollButtons="auto">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Week 2", "Week 3"].map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>
        </Box>
      </StorySection>
    </StoryPage>
  );
};

export const Scrollable: Story = {
  render: () => <ScrollableStory />,
};

const CenteredStory = () => {
  const bind = useTabs();

  return (
    <StoryPage>
      <StorySection title="centered" direction="column">
        <Tabs {...bind} centered>
          {LABELS.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </StorySection>
    </StoryPage>
  );
};

export const Centered: Story = {
  render: () => <CenteredStory />,
};

const WrappedStory = () => {
  const bind = useTabs();

  return (
    <StoryPage>
      <StorySection title="wrapped label" direction="column">
        <Tabs {...bind}>
          <Tab label="Short" />
          <Tab label="A Very Long Tab Label That Should Wrap" wrapped />
          <Tab label="Medium Label" />
        </Tabs>
      </StorySection>
    </StoryPage>
  );
};

export const Wrapped: Story = {
  render: () => <WrappedStory />,
};
