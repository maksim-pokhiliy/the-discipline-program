"use client";

import { useState } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";

import { useSession } from "@repo/auth/client";

import {
  useBlockKindsPageData,
  useExercisesPageData,
  useSchemeTemplatesPageData,
} from "@app/lib/hooks";

const TAB_VALUES = ["exercises", "block-kinds", "scheme-templates"] as const;

type TabValue = (typeof TAB_VALUES)[number];

const TAB_LABELS: Record<TabValue, string> = {
  exercises: "Exercises",
  "block-kinds": "Blocks",
  "scheme-templates": "Schemes",
};

const ListItem = ({ name, scope }: { name: string; scope?: string }) => (
  <Box
    sx={{
      px: 1,
      py: 0.75,
      borderRadius: 1,
      cursor: "grab",
      "&:hover": { bgcolor: "action.hover" },
    }}
  >
    <Typography variant="body2" noWrap>
      {name}
    </Typography>
    {scope && (
      <Typography variant="caption" color="text.secondary">
        {scope}
      </Typography>
    )}
  </Box>
);

const ExerciseList = ({ search, currentUserId }: { search: string; currentUserId: string }) => {
  const { data, isLoading } = useExercisesPageData(
    { search: search.length > 0 ? search : undefined },
    currentUserId,
  );

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No exercises
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <ListItem key={item.id} name={item.name} scope={item.scope} />
      ))}
    </Stack>
  );
};

const BlockKindList = ({ search, currentUserId }: { search: string; currentUserId: string }) => {
  const { data, isLoading } = useBlockKindsPageData(
    { search: search.length > 0 ? search : undefined },
    currentUserId,
  );

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No block kinds
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <ListItem key={item.id} name={item.name} scope={item.scope} />
      ))}
    </Stack>
  );
};

const SchemeTemplateList = ({
  search,
  currentUserId,
}: {
  search: string;
  currentUserId: string;
}) => {
  const { data, isLoading } = useSchemeTemplatesPageData(
    { search: search.length > 0 ? search : undefined },
    currentUserId,
  );

  if (isLoading) {
    return (
      <Typography variant="caption" color="text.secondary">
        Loading...
      </Typography>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        No schemes
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {items.map((item) => (
        <ListItem key={item.id} name={item.name} scope={item.scope} />
      ))}
    </Stack>
  );
};

export const LibraryPanel = () => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [tab, setTab] = useState<TabValue>("exercises");
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
        variant="fullWidth"
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
      </Box>
    </Stack>
  );
};
