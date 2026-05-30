"use client";

import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { useForm, useWatch } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { z } from "zod";

import type { RowKind } from "@repo/contracts/lms/schema-row";
import { BaseModal } from "@repo/ui";

import { useCreateSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import type { RowEditorMode } from "./row-editor-types";
import { assembleRowPayloadAndNotes, parseRowPayload } from "./row-form-utils";
import { RowPayloadFormDispatch } from "./row-payload-form-dispatch";
import { ROW_PAYLOAD_FORM_REGISTRY } from "./row-payload-form-registry";

const rowShellResolverSchema = z.object({ value: z.unknown() });

export type RowShellFormData = z.infer<typeof rowShellResolverSchema>;

const ROW_KIND_TITLE: Record<RowKind, string> = {
  EXERCISE: "exercise row",
  REST: "rest row",
  FOOTNOTE: "footnote row",
  STANDALONE_LOAD: "load row",
  STANDALONE_URL: "url row",
  PLACEHOLDER: "placeholder row",
  INNER_LADDER_MARKER: "ladder marker row",
  REP_DEFINITION: "rep definition row",
  REST_SLOT: "rest slot row",
};

type RowEditorModalProps = {
  open: boolean;
  onClose: () => void;
  mode: RowEditorMode;
  planId: string;
  startDate: string;
  onBack?: () => void;
};

const resolveRowKind = (mode: RowEditorMode): RowKind =>
  mode.kind === "create" ? mode.rowKind : mode.row.rowPayload.rowKind;

const toShellFormData = (mode: RowEditorMode): RowShellFormData => {
  const entry = ROW_PAYLOAD_FORM_REGISTRY[resolveRowKind(mode)];

  return mode.kind === "create" ? { value: entry?.defaultValue } : { value: entry?.toValue(mode) };
};

export const RowEditorModal: React.FC<RowEditorModalProps> = ({
  open,
  onClose,
  mode,
  planId,
  startDate,
  onBack,
}) => {
  const formId = useId();
  const createSchemaRow = useCreateSchemaRow(planId, startDate);
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);
  const [payloadError, setPayloadError] = useState<FieldErrors | undefined>(undefined);
  const isSubmittingRef = useRef(false);

  const { control, handleSubmit, reset, setValue } = useForm<RowShellFormData>({
    resolver: zodResolver(rowShellResolverSchema),
    defaultValues: toShellFormData(mode),
  });

  const value = useWatch({ control, name: "value" });

  useEffect(() => {
    setPayloadError(undefined);
    isSubmittingRef.current = false;
    reset(toShellFormData(mode));
  }, [mode, reset]);

  const isCreate = mode.kind === "create";
  const isPending = createSchemaRow.isPending || updateSchemaRow.isPending;
  const rowKind = resolveRowKind(mode);

  const onSubmit = (data: RowShellFormData): void => {
    if (isSubmittingRef.current || isPending) {
      return;
    }

    const { payloadInput, notes } = assembleRowPayloadAndNotes(rowKind, data.value);
    const parsed = parseRowPayload(rowKind, payloadInput);

    if (!parsed.ok) {
      setPayloadError(parsed.error);

      return;
    }

    setPayloadError(undefined);
    isSubmittingRef.current = true;

    if (mode.kind === "create") {
      createSchemaRow.mutate(
        { schemaId: mode.schemaId, rowKind, rowPayload: parsed.value, notes },
        {
          onSuccess: () => onClose(),
          onSettled: () => {
            isSubmittingRef.current = false;
          },
        },
      );

      return;
    }

    updateSchemaRow.mutate(
      { schemaRowId: mode.row.id, data: { rowPayload: parsed.value, notes } },
      {
        onSuccess: () => onClose(),
        onSettled: () => {
          isSubmittingRef.current = false;
        },
      },
    );
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    void handleSubmit(onSubmit)(e);
  };

  if (!open) {
    return null;
  }

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={`${isCreate ? "Add" : "Edit"} ${ROW_KIND_TITLE[rowKind]}`}
      subtitle={isCreate ? "step 2 of 2" : undefined}
      maxWidth="sm"
      disableBackdropClick={isPending}
      disableEscapeKeyDown={isPending}
      actions={
        <>
          {isCreate && onBack !== undefined && (
            <Button onClick={onBack} disabled={isPending} size="small">
              ← Back
            </Button>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Button onClick={onClose} disabled={isPending} size="small">
            Cancel
          </Button>

          <Button
            form={formId}
            type="submit"
            variant="contained"
            size="small"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} /> : null}
          >
            {isPending ? "Saving…" : "Save row"}
          </Button>
        </>
      }
    >
      <Stack component="form" id={formId} onSubmit={handleFormSubmit} spacing={3}>
        <RowPayloadFormDispatch
          rowKind={rowKind}
          value={value}
          onChange={(next) => setValue("value", next, { shouldDirty: true })}
          error={payloadError}
          disabled={isPending}
        />
      </Stack>
    </BaseModal>
  );
};
