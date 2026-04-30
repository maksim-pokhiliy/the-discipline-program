"use client";

import { useCallback } from "react";

import { Stack, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@repo/auth/client";
import { ChipTab, PageHeader } from "@repo/ui";

import {
  useBlockKindsPageData,
  useBlockTemplatesPageData,
  useExercisesPageData,
  useSchemeTemplatesPageData,
  useSessionTemplatesPageData,
  useWeekTemplatesPageData,
} from "@app/lib/hooks";

import {
  BlockKindsTab,
  BlockTemplatesTab,
  ExercisesTab,
  SchemeTemplatesTab,
  SessionTemplatesTab,
  WeekTemplatesTab,
} from "../sections";

const TAB_VALUES = [
  "exercises",
  "block-kinds",
  "scheme-templates",
  "block-templates",
  "session-templates",
  "week-templates",
] as const;

type TabValue = (typeof TAB_VALUES)[number];

const isTabValue = (value: string | null): value is TabValue => TAB_VALUES.some((v) => v === value);

const TAB_LABELS: Record<TabValue, string> = {
  exercises: "Exercises",
  "block-kinds": "Block kinds",
  "scheme-templates": "Scheme templates",
  "block-templates": "Block templates",
  "session-templates": "Session templates",
  "week-templates": "Week templates",
};

export const LibraryView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "exercises";
  const currentUserId = session?.user?.id;

  const exercisesQuery = useExercisesPageData({}, currentUserId);
  const blockKindsQuery = useBlockKindsPageData({}, currentUserId);
  const schemeTemplatesQuery = useSchemeTemplatesPageData({}, currentUserId);
  const blockTemplatesQuery = useBlockTemplatesPageData({}, currentUserId);
  const sessionTemplatesQuery = useSessionTemplatesPageData({}, currentUserId);
  const weekTemplatesQuery = useWeekTemplatesPageData({}, currentUserId);

  const handleTabChange = useCallback(
    (_: unknown, value: TabValue) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("tab", value);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  if (!currentUserId) {
    return null;
  }

  const counts: Record<TabValue, number> = {
    exercises: exercisesQuery.data?.total ?? 0,
    "block-kinds": blockKindsQuery.data?.total ?? 0,
    "scheme-templates": schemeTemplatesQuery.data?.total ?? 0,
    "block-templates": blockTemplatesQuery.data?.total ?? 0,
    "session-templates": sessionTemplatesQuery.data?.total ?? 0,
    "week-templates": weekTemplatesQuery.data?.total ?? 0,
  };

  return (
    <Stack spacing={4}>
      <PageHeader title="Library" />

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="Library tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        {TAB_VALUES.map((value) => (
          <ChipTab
            key={value}
            value={value}
            label={TAB_LABELS[value]}
            count={counts[value]}
            chipColor={activeTab === value ? "primary" : "default"}
          />
        ))}
      </Tabs>

      {activeTab === "exercises" && <ExercisesTab currentUserId={currentUserId} />}
      {activeTab === "block-kinds" && <BlockKindsTab currentUserId={currentUserId} />}
      {activeTab === "scheme-templates" && <SchemeTemplatesTab currentUserId={currentUserId} />}
      {activeTab === "block-templates" && <BlockTemplatesTab currentUserId={currentUserId} />}
      {activeTab === "session-templates" && <SessionTemplatesTab currentUserId={currentUserId} />}
      {activeTab === "week-templates" && <WeekTemplatesTab currentUserId={currentUserId} />}
    </Stack>
  );
};
