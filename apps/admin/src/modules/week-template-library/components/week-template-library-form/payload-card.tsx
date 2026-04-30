"use client";

import { Stack, Typography } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import {
  type CreateWeekTemplateInput,
  type UpdateWeekTemplateInput,
} from "@repo/contracts/lms/week-template";
import { FormCard } from "@repo/ui";

type FormValues = CreateWeekTemplateInput & UpdateWeekTemplateInput;

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

  const days = payload.days ?? [];
  const sessionsCount = days.reduce((acc, day) => acc + (day.sessions?.length ?? 0), 0);
  const blocksCount = days.reduce(
    (acc, day) =>
      acc +
      (day.sessions ?? []).reduce((sessAcc, session) => sessAcc + (session.blocks?.length ?? 0), 0),
    0,
  );
  const segmentsCount = days.reduce(
    (acc, day) =>
      acc +
      (day.sessions ?? []).reduce(
        (sessAcc, session) =>
          sessAcc +
          (session.blocks ?? []).reduce(
            (blockAcc, block) => blockAcc + (block.segments?.length ?? 0),
            0,
          ),
        0,
      ),
    0,
  );

  return (
    <FormCard title="Payload snapshot">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Read-only summary of the captured week tree. Edit the source plan and re-save the template
          to update.
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Days:</strong> {days.length}
          </Typography>
          <Typography variant="body2">
            <strong>Sessions:</strong> {sessionsCount}
          </Typography>
          <Typography variant="body2">
            <strong>Blocks:</strong> {blocksCount}
          </Typography>
          <Typography variant="body2">
            <strong>Segments:</strong> {segmentsCount}
          </Typography>
        </Stack>
      </Stack>
    </FormCard>
  );
};
