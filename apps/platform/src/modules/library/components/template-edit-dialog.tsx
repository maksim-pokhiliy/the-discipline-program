"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { MenuItem, Stack, TextField } from "@mui/material";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  type BlockTemplate,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";
import {
  type SessionTemplate,
  type UpdateSessionTemplateInput,
} from "@repo/contracts/lms/session-template";
import { type WeekTemplate, type UpdateWeekTemplateInput } from "@repo/contracts/lms/week-template";
import { FormModal } from "@repo/ui";

import {
  useCurrentUserRole,
  useUpdateBlockTemplate,
  useUpdateSessionTemplate,
  useUpdateWeekTemplate,
} from "@app/lib/hooks";

const TEMPLATE_NAME_MAX = 100;
const TEMPLATE_DESCRIPTION_MAX = 500;

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(TEMPLATE_NAME_MAX),
  description: z.string().max(TEMPLATE_DESCRIPTION_MAX).optional(),
  scope: z.enum(["SYSTEM", "COACH"]),
});

type TemplateEditFormInput = z.infer<typeof editFormSchema>;

const SCOPE_OPTIONS = [
  { value: "COACH", label: "Coach" },
  { value: "SYSTEM", label: "System" },
] as const;

type TemplateKind = "block" | "session" | "week";

const TITLE_BY_KIND: Record<TemplateKind, string> = {
  block: "Edit block template",
  session: "Edit session template",
  week: "Edit week template",
};

type TemplateEditDialogBaseProps = {
  open: boolean;
  onClose: () => void;
};

export type TemplateEditDialogProps = TemplateEditDialogBaseProps &
  (
    | { kind: "block"; template: BlockTemplate | null }
    | { kind: "session"; template: SessionTemplate | null }
    | { kind: "week"; template: WeekTemplate | null }
  );

type AnyTemplate = BlockTemplate | SessionTemplate | WeekTemplate;

const buildDefaults = (template: AnyTemplate | null): TemplateEditFormInput => ({
  name: template?.name ?? "",
  description: template?.description ?? undefined,
  scope: template?.scope ?? "COACH",
});

export const TemplateEditDialog = (props: TemplateEditDialogProps) => {
  const { open, kind, template, onClose } = props;

  const role = useCurrentUserRole();
  const isPrivileged = role === UserRole.ADMIN || role === UserRole.HEAD_COACH;

  const updateBlockMutation = useUpdateBlockTemplate();
  const updateSessionMutation = useUpdateSessionTemplate();
  const updateWeekMutation = useUpdateWeekTemplate();

  const isPending =
    updateBlockMutation.isPending ||
    updateSessionMutation.isPending ||
    updateWeekMutation.isPending;

  const methods = useForm<TemplateEditFormInput>({
    resolver: zodResolver(editFormSchema),
    defaultValues: buildDefaults(template),
  });

  useEffect(() => {
    if (open) {
      methods.reset(buildDefaults(template));
    }
  }, [open, template, methods]);

  const submit = methods.handleSubmit((data) => {
    if (!template) {
      return;
    }

    const trimmedDescription = data.description?.trim();
    const description: string | null =
      trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : null;
    const id = template.id;

    if (kind === "block") {
      const payload: UpdateBlockTemplateInput = {
        name: data.name.trim(),
        description,
        ...(isPrivileged ? { scope: data.scope } : {}),
      };

      updateBlockMutation.mutate({ id, data: payload }, { onSuccess: () => onClose() });

      return;
    }

    if (kind === "session") {
      const payload: UpdateSessionTemplateInput = {
        name: data.name.trim(),
        description,
        ...(isPrivileged ? { scope: data.scope } : {}),
      };

      updateSessionMutation.mutate({ id, data: payload }, { onSuccess: () => onClose() });

      return;
    }

    const payload: UpdateWeekTemplateInput = {
      name: data.name.trim(),
      description,
      ...(isPrivileged ? { scope: data.scope } : {}),
    };

    updateWeekMutation.mutate({ id, data: payload }, { onSuccess: () => onClose() });
  });

  const {
    register,
    control,
    formState: { errors },
  } = methods;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={submit}
      isSubmitting={isPending}
      title={TITLE_BY_KIND[kind]}
      submitText="Save changes"
      maxWidth="sm"
    >
      <FormProvider {...methods}>
        <Stack spacing={4}>
          <TextField
            label="Name"
            variant="outlined"
            fullWidth
            disabled={isPending}
            error={!!errors.name}
            helperText={errors.name?.message}
            inputProps={{ maxLength: TEMPLATE_NAME_MAX }}
            {...register("name")}
          />

          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            multiline
            minRows={3}
            disabled={isPending}
            error={!!errors.description}
            helperText={errors.description?.message}
            inputProps={{ maxLength: TEMPLATE_DESCRIPTION_MAX }}
            {...register("description")}
          />

          {isPrivileged && (
            <Controller
              name="scope"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Visibility"
                  select
                  variant="outlined"
                  fullWidth
                  disabled={isPending}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ??
                    "COACH templates are private to the owner. SYSTEM is global."
                  }
                >
                  {SCOPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}
        </Stack>
      </FormProvider>
    </FormModal>
  );
};
