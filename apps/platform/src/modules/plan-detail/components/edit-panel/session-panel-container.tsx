"use client";

import { useSessionsByDay } from "@app/lib/hooks";

import { type OpenPanel } from "../../lib/use-edit-panel-state";

import { type SaveStatusChange } from "./edit-panel-status";
import { SessionEditPanel } from "./session-edit-panel";

type SessionPanel = Extract<OpenPanel, { kind: "session" }>;

type SessionPanelContainerProps = {
  planId: string;
  panel: SessionPanel;
  onClose: () => void;
  onStatusChange: SaveStatusChange;
};

export const SessionPanelContainer: React.FC<SessionPanelContainerProps> = ({
  planId,
  panel,
  onClose,
  onStatusChange,
}) => {
  const sessionsQuery = useSessionsByDay(planId, panel.dayId);
  const sessions = sessionsQuery.data?.sessions ?? [];
  const existingSession = sessions.find((session) => session.id === panel.sessionId) ?? null;

  return (
    <SessionEditPanel
      planId={planId}
      dayId={panel.dayId}
      sessionId={panel.sessionId}
      existingSession={existingSession}
      existingSessions={sessions}
      onClose={onClose}
      onStatusChange={onStatusChange}
    />
  );
};
