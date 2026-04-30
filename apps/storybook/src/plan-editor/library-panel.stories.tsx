import { useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const TAB_VALUES = [
  "exercises",
  "block-kinds",
  "scheme-templates",
  "block-templates",
  "session-templates",
  "week-templates",
] as const;

type TabValue = (typeof TAB_VALUES)[number];

const TAB_LABELS: Record<TabValue, string> = {
  exercises: "Exercises",
  "block-kinds": "Blocks",
  "scheme-templates": "Schemes",
  "block-templates": "Block tpl",
  "session-templates": "Session tpl",
  "week-templates": "Week tpl",
};

type LibraryItem = { id: string; name: string; description?: string; scope?: "SYSTEM" | "COACH" };

const sampleItems: Record<TabValue, LibraryItem[]> = {
  exercises: [
    { id: "ex1", name: "Back Squat", scope: "SYSTEM" },
    { id: "ex2", name: "Bench Press", scope: "SYSTEM" },
    { id: "ex3", name: "Push Press (mine)", scope: "COACH" },
  ],
  "block-kinds": [
    { id: "bk1", name: "Strength", scope: "SYSTEM" },
    { id: "bk2", name: "Conditioning", scope: "SYSTEM" },
  ],
  "scheme-templates": [
    { id: "st1", name: "5×5 progression", scope: "SYSTEM" },
    { id: "st2", name: "EMOM 10", scope: "SYSTEM" },
  ],
  "block-templates": [
    {
      id: "bt1",
      name: "Squat focus block",
      description: "3 segments, 12 entries",
      scope: "COACH",
    },
    { id: "bt2", name: "Pull volume", description: "2 segments", scope: "SYSTEM" },
  ],
  "session-templates": [
    { id: "sst1", name: "Strength A session", description: "2 blocks", scope: "COACH" },
  ],
  "week-templates": [
    { id: "wt1", name: "Foundations week 1", description: "5 days", scope: "SYSTEM" },
  ],
};

type DemoLibraryPanelProps = {
  initialTab?: TabValue;
};

const DemoLibraryPanel = ({ initialTab = "exercises" }: DemoLibraryPanelProps) => {
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [search, setSearch] = useState("");

  const items = sampleItems[tab].filter((item) =>
    search.trim().length === 0
      ? true
      : item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Stack
      spacing={2}
      sx={{
        height: 480,
        width: 320,
        p: 2,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflowY: "auto",
      }}
    >
      <Typography variant="h6">Library</Typography>

      <Tabs
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ minHeight: 36 }}
      >
        {TAB_VALUES.map((value) => (
          <Tab key={value} value={value} label={TAB_LABELS[value]} sx={{ minHeight: 36 }} />
        ))}
      </Tabs>

      <TextField
        size="small"
        placeholder="Search..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {items.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No matches
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  px: 1,
                  py: 0.75,
                  borderRadius: 1,
                  cursor: "grab",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Typography variant="body2">{item.name}</Typography>
                {item.description ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                ) : null}
                {item.scope ? (
                  <Typography variant="caption" color="text.secondary">
                    {item.scope}
                  </Typography>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

const meta = {
  title: "Plan Editor/Library Panel",
  component: DemoLibraryPanel,
  args: { initialTab: "exercises" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoLibraryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Exercises: Story = { args: { initialTab: "exercises" } };
export const BlockKinds: Story = { args: { initialTab: "block-kinds" } };
export const SchemeTemplates: Story = { args: { initialTab: "scheme-templates" } };
export const BlockTemplates: Story = { args: { initialTab: "block-templates" } };
export const SessionTemplates: Story = { args: { initialTab: "session-templates" } };
export const WeekTemplates: Story = { args: { initialTab: "week-templates" } };

export const AllSixTabs: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="library panel renders 6 tabs (atoms + templates)">
        <DemoLibraryPanel initialTab="block-templates" />
      </StorySection>
    </StoryPage>
  ),
};
