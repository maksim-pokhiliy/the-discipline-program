"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import {
  type CreatePlanSessionRequest,
  createPlanSessionRequestSchema,
  type PlanSession,
  type UpdatePlanSessionRequest,
} from "@repo/contracts/lms/plan-session";

import { useCreatePlanSession, useUpdatePlanSession } from "@app/lib/hooks";

import { toErrorMessage } from "../../lib/to-error-message";
import { useSubmitGuard } from "../../lib/use-submit-guard";

import { EditPanel } from "./edit-panel";
import { type SaveStatusChange } from "./edit-panel-status";

type SessionEditPanelProps = {
  planId: string;
  dayId: string;
  sessionId: string | null;
  existingSession?: PlanSession | null;
  existingSessions: readonly PlanSession[];
  onClose: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  onStatusChange?: SaveStatusChange;
};

type SessionFormInput = z.input<typeof createPlanSessionRequestSchema>;

const buildDefaults = (
  existing: PlanSession | null | undefined,
  existingSessions: readonly PlanSession[],
): SessionFormInput => {
  if (existing) {
    return { order: existing.order, label: existing.label ?? "" };
  }

  return { order: existingSessions.length, label: "" };
};

const toCreateRequest = (values: CreatePlanSessionRequest): CreatePlanSessionRequest => {
  const label = values.label?.trim() ?? "";

  return {
    order: values.order,
    ...(label.length > 0 ? { label } : {}),
  };
};

const toUpdateRequest = (values: CreatePlanSessionRequest): UpdatePlanSessionRequest => {
  const label = values.label?.trim() ?? "";

  return {
    order: values.order,
    label: label.length > 0 ? label : null,
  };
};

export const SessionEditPanel: React.FC<SessionEditPanelProps> = ({
  planId,
  dayId,
  sessionId,
  existingSession,
  existingSessions,
  onClose,
  onDirtyChange,
  onStatusChange,
}) => {
  const createSession = useCreatePlanSession({ planId, dayId });
  const updateSession = useUpdatePlanSession({ planId, dayId });

  const isCreate = sessionId === null;

  const form = useForm<SessionFormInput, unknown, CreatePlanSessionRequest>({
    resolver: zodResolver(createPlanSessionRequestSchema),
    defaultValues: buildDefaults(existingSession, existingSessions),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, errors },
  } = form;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const isSaving = createSession.isPending || updateSession.isPending;

  const submitData = async (data: CreatePlanSessionRequest): Promise<void> => {
    onStatusChange?.("saving");

    try {
      if (sessionId === null) {
        await createSession.mutateAsync(toCreateRequest(data));
      } else {
        await updateSession.mutateAsync({ id: sessionId, data: toUpdateRequest(data) });
      }

      reset({ order: data.order, label: data.label ?? "" });
      onStatusChange?.("saved");
      onClose();
    } catch (error) {
      onStatusChange?.("error", {
        message: toErrorMessage(error),
        retry: () => submitData(data),
      });
    }
  };

  const onSubmit = useSubmitGuard(handleSubmit(submitData));

  const title = isCreate ? "Add session" : "Edit session";

  return (
    <EditPanel
      open
      onClose={onClose}
      title={title}
      isSaving={isSaving}
      canSave={isDirty && Object.keys(errors).length === 0}
      onSave={() => void onSubmit()}
      onCancel={onClose}
    >
      <Stack spacing={3}>
        <TextField
          label="Order"
          type="number"
          size="small"
          fullWidth
          disabled={isSaving}
          error={Boolean(errors.order)}
          helperText={errors.order?.message}
          inputProps={{ min: 0, step: 1 }}
          {...register("order", { valueAsNumber: true })}
        />

        <TextField
          label="Label"
          placeholder="Optional session label"
          size="small"
          fullWidth
          disabled={isSaving}
          error={Boolean(errors.label)}
          helperText={errors.label?.message}
          {...register("label")}
        />
      </Stack>
    </EditPanel>
  );
};
