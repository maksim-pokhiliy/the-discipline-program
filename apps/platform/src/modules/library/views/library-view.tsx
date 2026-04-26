"use client";

import { useCallback } from "react";

import { Box, Stack, Tab, Tabs } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useSession } from "@repo/auth/client";
import { PageHeader } from "@repo/ui";

import { BlockKindsTab, ExercisesTab, SchemeTemplatesTab } from "../sections";

const TAB_VALUES = ["exercises", "block-kinds", "scheme-templates"] as const;

type TabValue = (typeof TAB_VALUES)[number];

const isTabValue = (value: string | null): value is TabValue => TAB_VALUES.some((v) => v === value);

const TAB_LABELS: Record<TabValue, string> = {
  exercises: "Exercises",
  "block-kinds": "Block kinds",
  "scheme-templates": "Scheme templates",
};

export const LibraryView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "exercises";
  const currentUserId = session?.user?.id;

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

  return (
    <Stack spacing={3}>
      <PageHeader title="Library" />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Library tabs">
          {TAB_VALUES.map((value) => (
            <Tab key={value} value={value} label={TAB_LABELS[value]} />
          ))}
        </Tabs>
      </Box>

      {activeTab === "exercises" && <ExercisesTab currentUserId={currentUserId} />}
      {activeTab === "block-kinds" && <BlockKindsTab currentUserId={currentUserId} />}
      {activeTab === "scheme-templates" && <SchemeTemplatesTab currentUserId={currentUserId} />}
    </Stack>
  );
};
