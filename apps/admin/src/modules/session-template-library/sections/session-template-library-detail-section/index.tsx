"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type SessionTemplate } from "@repo/contracts/lms/session-template";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { SessionTemplateLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";

type SessionTemplateLibraryDetailSectionProps = {
  sessionTemplate: SessionTemplate;
  isPending: boolean;
};

export const SessionTemplateLibraryDetailSection = ({
  sessionTemplate,
  isPending,
}: SessionTemplateLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const ownerCoach = coaches?.find((c) => c.userId === sessionTemplate.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{sessionTemplate.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={sessionTemplate.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[sessionTemplate.scope]}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <SessionTemplateLibraryForm isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={sessionTemplate.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {sessionTemplate.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: sessionTemplate.ownerId }
                }
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
          </DetailField>
          <DetailField
            label="Created"
            labelWidth={theme.spacing(12)}
            value={formatDate(sessionTemplate.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(sessionTemplate.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
