"use client";

import { useCallback, useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@repo/auth/client";

import { BlockKindList } from "./block-kind-list";
import { BlockTemplateList } from "./block-template-list";
import { ExerciseList } from "./exercise-list";
import { SchemeTemplateList } from "./scheme-template-list";
import { SessionTemplateList } from "./session-template-list";
import { WeekTemplateList } from "./week-template-list";

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

const LIBRARY_TAB_PARAM = "lib-tab";
const DEFAULT_TAB: TabValue = "exercises";

const isTabValue = (value: string | null): value is TabValue =>
  value !== null && (TAB_VALUES as readonly string[]).includes(value);

export const LibraryPanel = () => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get(LIBRARY_TAB_PARAM);
  const tab: TabValue = isTabValue(tabParam) ? tabParam : DEFAULT_TAB;

  const setTab = useCallback(
    (next: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === DEFAULT_TAB) {
        params.delete(LIBRARY_TAB_PARAM);
      } else {
        params.set(LIBRARY_TAB_PARAM, next);
      }

      const query = params.toString();

      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [search, setSearch] = useState("");

  if (!currentUserId) {
    return null;
  }

  return (
    <Stack
      spacing={2}
      sx={{
        height: "100%",
        p: 2,
        bgcolor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
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
        onChange={(e) => setSearch(e.target.value)}
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
        {tab === "exercises" && <ExerciseList search={search} currentUserId={currentUserId} />}
        {tab === "block-kinds" && <BlockKindList search={search} currentUserId={currentUserId} />}
        {tab === "scheme-templates" && (
          <SchemeTemplateList search={search} currentUserId={currentUserId} />
        )}
        {tab === "block-templates" && (
          <BlockTemplateList search={search} currentUserId={currentUserId} />
        )}
        {tab === "session-templates" && (
          <SessionTemplateList search={search} currentUserId={currentUserId} />
        )}
        {tab === "week-templates" && (
          <WeekTemplateList search={search} currentUserId={currentUserId} />
        )}
      </Box>
    </Stack>
  );
};
