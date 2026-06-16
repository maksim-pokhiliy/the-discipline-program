"use client";

import { useMemo, useState } from "react";

import ForumIcon from "@mui/icons-material/Forum";
import { Stack, Tabs, Typography } from "@mui/material";

import { type AthleteDailySummary, TodayStatus } from "@repo/contracts/coaching/coach-dashboard";
import { BatchActionBar, ChipTab, RosterList, SectionHead } from "@repo/ui";

import { SelectAllButton } from "./select-all-button";
import { TodayRosterRow } from "./today-roster-row";

const TITLE = "Today";
const EMPTY_BUCKET_TEXT = "Nothing in this bucket.";
const MESSAGE_LABEL = "Message";

const FILTER_TABS: {
  status: TodayStatus;
  label: string;
  chipColor: "error" | "warning" | "success";
}[] = [
  { status: TodayStatus.MISSED, label: "Missed", chipColor: "error" },
  { status: TodayStatus.PENDING, label: "Pending", chipColor: "warning" },
  { status: TodayStatus.COMPLETED, label: "Done", chipColor: "success" },
];

type TodayRosterSectionProps = {
  athletes: AthleteDailySummary[];
  onOpenAthlete: (athleteId: string) => void;
};

export const TodayRosterSection: React.FC<TodayRosterSectionProps> = ({
  athletes,
  onOpenAthlete,
}) => {
  const [activeTab, setActiveTab] = useState<TodayStatus>(TodayStatus.MISSED);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const counts = useMemo(() => {
    const byStatus = new Map<TodayStatus, AthleteDailySummary[]>();

    for (const tab of FILTER_TABS) {
      byStatus.set(
        tab.status,
        athletes.filter((a) => a.todayStatus === tab.status),
      );
    }

    return byStatus;
  }, [athletes]);

  const visible = counts.get(activeTab) ?? [];
  const completedCount = counts.get(TodayStatus.COMPLETED)?.length ?? 0;
  const total = FILTER_TABS.reduce((sum, tab) => sum + (counts.get(tab.status)?.length ?? 0), 0);
  const isSelecting = selected.size > 0;

  const toggle = (id: string): void =>
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });

  const visibleIds = visible.map((a) => a.userId);
  const selectedVisibleCount = visibleIds.filter((id) => selected.has(id)).length;

  const toggleAllVisible = (): void =>
    setSelected((prev) => {
      const next = new Set(prev);
      const selectAll = selectedVisibleCount !== visibleIds.length;

      for (const id of visibleIds) {
        if (selectAll) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }

      return next;
    });

  const messageSelected = (): void => {
    const emails = athletes.filter((a) => selected.has(a.userId)).map((a) => a.email);

    window.location.href = `mailto:${emails.join(",")}`;
  };

  return (
    <Stack spacing={1}>
      <SectionHead
        title={TITLE}
        meta={`${completedCount}/${total} done`}
        action={
          visible.length > 0 ? (
            <SelectAllButton
              total={visibleIds.length}
              selectedCount={selectedVisibleCount}
              onToggle={toggleAllVisible}
            />
          ) : undefined
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, value: TodayStatus) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {FILTER_TABS.map((tab) => (
          <ChipTab
            key={tab.status}
            value={tab.status}
            label={tab.label}
            count={counts.get(tab.status)?.length ?? 0}
            chipColor={tab.chipColor}
          />
        ))}
      </Tabs>

      <RosterList>
        {visible.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", p: 1.5 }}>
            {EMPTY_BUCKET_TEXT}
          </Typography>
        ) : (
          visible.map((athlete) => (
            <TodayRosterRow
              key={athlete.userId}
              athlete={athlete}
              isSelecting={isSelecting}
              isChecked={selected.has(athlete.userId)}
              onToggle={toggle}
              onOpen={onOpenAthlete}
            />
          ))
        )}
      </RosterList>

      {isSelecting && (
        <BatchActionBar
          count={selected.size}
          onCancel={() => setSelected(new Set())}
          primaryLabel={`${MESSAGE_LABEL} ${selected.size}`}
          onPrimary={messageSelected}
          primaryIcon={<ForumIcon />}
        />
      )}
    </Stack>
  );
};
