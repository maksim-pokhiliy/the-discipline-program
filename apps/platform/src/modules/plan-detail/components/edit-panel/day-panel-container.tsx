"use client";

import { useMemo } from "react";

import { type DayType } from "@repo/contracts/lms/day-type";
import { type PlanDay } from "@repo/contracts/lms/plan-day";

import { buildDayTypeMap } from "../../lib/library-lookup";
import { type OpenPanel } from "../../lib/use-edit-panel-state";

import { DayEditPanel } from "./day-edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

type DayPanel = Extract<OpenPanel, { kind: "day" }>;

type DayPanelContainerProps = {
  planId: string;
  panel: DayPanel;
  days: readonly PlanDay[];
  dayTypes: readonly DayType[];
  onClose: () => void;
  onStatusChange: SaveStatusChange;
};

export const DayPanelContainer: React.FC<DayPanelContainerProps> = ({
  planId,
  panel,
  days,
  dayTypes,
  onClose,
  onStatusChange,
}) => {
  const dayTypeMap = useMemo(() => buildDayTypeMap(dayTypes), [dayTypes]);
  const existingDay = useMemo(
    () => days.find((day) => day.id === panel.dayId) ?? null,
    [days, panel.dayId],
  );

  return (
    <DayEditPanel
      planId={planId}
      date={panel.date}
      dayId={panel.dayId}
      existingDay={existingDay}
      lookups={{ dayTypes: dayTypeMap }}
      onClose={onClose}
      onStatusChange={onStatusChange}
    />
  );
};
