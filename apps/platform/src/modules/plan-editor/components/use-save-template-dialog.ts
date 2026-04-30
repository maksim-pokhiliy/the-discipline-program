"use client";

import { useEffect, useMemo, useState } from "react";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type GetPlanStructureResponse,
  type PlanStructureBlock,
} from "@repo/contracts/lms/training-plan";

import {
  useCreateBlockTemplate,
  useCreateSessionTemplate,
  useCreateWeekTemplate,
  useCurrentUserRole,
} from "@app/lib/hooks";

import {
  collectSessions,
  collectWeeks,
  findSessionContaining,
  findWeekContaining,
  SCOPE_OPTIONS,
  type SaveTemplateScope,
  type SessionOption,
  type WeekOption,
} from "./save-template-dialog-helpers";
import {
  buildBlockTemplatePayload,
  buildSessionTemplatePayload,
  buildWeekTemplatePayload,
} from "./save-template-payload";

export type UseSaveTemplateDialogInput = {
  open: boolean;
  onClose: () => void;
  planStructure: GetPlanStructureResponse | undefined;
  selectedBlock: PlanStructureBlock | null;
  initialScope?: SaveTemplateScope;
};

export type ScopeOption = { value: "COACH" | "SYSTEM"; label: string };

export type UseSaveTemplateDialogApi = {
  scopeTab: SaveTemplateScope;
  setScopeTab: (next: SaveTemplateScope) => void;
  name: string;
  setName: (next: string) => void;
  description: string;
  setDescription: (next: string) => void;
  scope: "COACH" | "SYSTEM";
  setScope: (next: "COACH" | "SYSTEM") => void;
  scopeOptions: ReadonlyArray<ScopeOption>;
  isPrivileged: boolean;
  sessionOptions: ReadonlyArray<SessionOption>;
  weekOptions: ReadonlyArray<WeekOption>;
  sessionId: string;
  setSessionId: (next: string) => void;
  weekId: string;
  setWeekId: (next: string) => void;
  inferredSession: boolean;
  inferredWeek: boolean;
  isPending: boolean;
  submitted: boolean;
  blockMissing: boolean;
  sessionMissing: boolean;
  weekMissing: boolean;
  submit: () => void;
};

export const useSaveTemplateDialog = ({
  open,
  onClose,
  planStructure,
  selectedBlock,
  initialScope,
}: UseSaveTemplateDialogInput): UseSaveTemplateDialogApi => {
  const role = useCurrentUserRole();
  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  const scopeOptions = useMemo<ReadonlyArray<ScopeOption>>(
    () =>
      isPrivileged
        ? SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
        : SCOPE_OPTIONS.filter((o) => o.value === "COACH").map((o) => ({
            value: o.value,
            label: o.label,
          })),
    [isPrivileged],
  );

  const sessionOptions = useMemo(() => collectSessions(planStructure), [planStructure]);
  const weekOptions = useMemo(() => collectWeeks(planStructure), [planStructure]);

  const inferredSessionRef = useMemo(
    () => (selectedBlock ? findSessionContaining(planStructure, selectedBlock.id) : null),
    [planStructure, selectedBlock],
  );
  const inferredWeekRef = useMemo(
    () => (selectedBlock ? findWeekContaining(planStructure, selectedBlock.id) : null),
    [planStructure, selectedBlock],
  );

  const defaultScope: SaveTemplateScope = initialScope ?? "block";

  const [scopeTab, setScopeTab] = useState<SaveTemplateScope>(defaultScope);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<"COACH" | "SYSTEM">("COACH");
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [weekId, setWeekId] = useState<string>("");

  const createBlockTemplate = useCreateBlockTemplate();
  const createSessionTemplate = useCreateSessionTemplate();
  const createWeekTemplate = useCreateWeekTemplate();

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setScope("COACH");
      setSubmitted(false);
      setSessionId("");
      setWeekId("");
      setScopeTab(defaultScope);
    }
  }, [defaultScope, open]);

  useEffect(() => {
    if (!isPrivileged && scope === "SYSTEM") {
      setScope("COACH");
    }
  }, [isPrivileged, scope]);

  useEffect(() => {
    if (!open || scopeTab !== "session" || sessionId) {
      return;
    }

    if (inferredSessionRef) {
      setSessionId(inferredSessionRef.id);

      return;
    }

    const first = sessionOptions[0];

    if (first) {
      setSessionId(first.id);
    }
  }, [inferredSessionRef, open, scopeTab, sessionId, sessionOptions]);

  useEffect(() => {
    if (!open || scopeTab !== "week" || weekId) {
      return;
    }

    if (inferredWeekRef) {
      setWeekId(inferredWeekRef.id);

      return;
    }

    const first = weekOptions[0];

    if (first) {
      setWeekId(first.id);
    }
  }, [inferredWeekRef, open, scopeTab, weekId, weekOptions]);

  const isPending =
    createBlockTemplate.isPending ||
    createSessionTemplate.isPending ||
    createWeekTemplate.isPending;

  const resolvedSession = useMemo(
    () => sessionOptions.find((opt) => opt.id === sessionId)?.session ?? null,
    [sessionId, sessionOptions],
  );
  const resolvedWeek = useMemo(
    () => weekOptions.find((opt) => opt.id === weekId)?.week ?? null,
    [weekId, weekOptions],
  );

  const blockMissing = scopeTab === "block" && !selectedBlock;
  const sessionMissing = scopeTab === "session" && !resolvedSession;
  const weekMissing = scopeTab === "week" && !resolvedWeek;

  const submit = () => {
    setSubmitted(true);

    if (name.trim().length === 0) {
      return;
    }

    const baseInput = {
      name: name.trim(),
      description: description.trim().length > 0 ? description.trim() : undefined,
      scope,
    };

    if (scopeTab === "block") {
      if (!selectedBlock) {
        return;
      }

      createBlockTemplate.mutate(
        { ...baseInput, payload: buildBlockTemplatePayload(selectedBlock) },
        { onSuccess: onClose },
      );

      return;
    }

    if (scopeTab === "session") {
      if (!resolvedSession) {
        return;
      }

      createSessionTemplate.mutate(
        { ...baseInput, payload: buildSessionTemplatePayload(resolvedSession) },
        { onSuccess: onClose },
      );

      return;
    }

    if (!resolvedWeek) {
      return;
    }

    createWeekTemplate.mutate(
      { ...baseInput, payload: buildWeekTemplatePayload(resolvedWeek) },
      { onSuccess: onClose },
    );
  };

  return {
    scopeTab,
    setScopeTab,
    name,
    setName,
    description,
    setDescription,
    scope,
    setScope,
    scopeOptions,
    isPrivileged,
    sessionOptions,
    weekOptions,
    sessionId,
    setSessionId,
    weekId,
    setWeekId,
    inferredSession: inferredSessionRef !== null,
    inferredWeek: inferredWeekRef !== null,
    isPending,
    submitted,
    blockMissing,
    sessionMissing,
    weekMissing,
    submit,
  };
};
