"use client";

import { Stack, Typography } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import {
  type CreateBlockTemplateInput,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";
import { FormCard } from "@repo/ui";

type FormValues = CreateBlockTemplateInput & UpdateBlockTemplateInput;

export const PayloadCard = () => {
  const { control } = useFormContext<FormValues>();
  const payload = useWatch({ control, name: "payload" });

  if (!payload) {
    return (
      <FormCard title="Payload snapshot">
        <Typography variant="body2" color="text.secondary">
          No payload captured yet. Templates are created from the plan editor via Cmd+Shift+S.
        </Typography>
      </FormCard>
    );
  }

  const segmentsCount = payload.segments.length;
  const setGroupsCount = payload.segments.reduce(
    (acc, segment) => acc + segment.setGroups.length,
    0,
  );
  const entriesCount = payload.segments.reduce(
    (acc, segment) =>
      acc + segment.setGroups.reduce((groupAcc, group) => groupAcc + group.entries.length, 0),
    0,
  );

  return (
    <FormCard title="Payload snapshot">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Read-only summary of the captured block tree. Edit the source plan and re-save the
          template to update.
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Segments:</strong> {segmentsCount}
          </Typography>
          <Typography variant="body2">
            <strong>Set groups:</strong> {setGroupsCount}
          </Typography>
          <Typography variant="body2">
            <strong>Exercise entries:</strong> {entriesCount}
          </Typography>
        </Stack>
      </Stack>
    </FormCard>
  );
};
