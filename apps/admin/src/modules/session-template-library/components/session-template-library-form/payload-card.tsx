"use client";

import { Stack, Typography } from "@mui/material";
import { useFormContext, useWatch } from "react-hook-form";

import {
  type CreateSessionTemplateInput,
  type UpdateSessionTemplateInput,
} from "@repo/contracts/lms/session-template";
import { FormCard } from "@repo/ui";

type FormValues = CreateSessionTemplateInput & UpdateSessionTemplateInput;

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

  const blocksCount = payload.blocks?.length ?? 0;
  const segmentsCount = (payload.blocks ?? []).reduce(
    (acc, block) => acc + (block.segments?.length ?? 0),
    0,
  );
  const setGroupsCount = (payload.blocks ?? []).reduce(
    (acc, block) =>
      acc +
      (block.segments ?? []).reduce(
        (segAcc, segment) => segAcc + (segment.setGroups?.length ?? 0),
        0,
      ),
    0,
  );
  const entriesCount = (payload.blocks ?? []).reduce(
    (acc, block) =>
      acc +
      (block.segments ?? []).reduce(
        (segAcc, segment) =>
          segAcc +
          (segment.setGroups ?? []).reduce(
            (groupAcc, group) => groupAcc + (group.entries?.length ?? 0),
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
          Read-only summary of the captured session tree. Edit the source plan and re-save the
          template to update.
        </Typography>

        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Blocks:</strong> {blocksCount}
          </Typography>
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
