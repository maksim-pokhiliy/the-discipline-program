"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type WeekTemplate } from "@repo/contracts/lms/week-template";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { WeekTemplateLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";

type WeekTemplateLibraryDetailSectionProps = {
  weekTemplate: WeekTemplate;
  isPending: boolean;
};

export const WeekTemplateLibraryDetailSection = ({
  weekTemplate,
  isPending,
}: WeekTemplateLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const ownerCoach = coaches?.find((c) => c.userId === weekTemplate.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{weekTemplate.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={weekTemplate.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[weekTemplate.scope]}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <WeekTemplateLibraryForm isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={weekTemplate.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {weekTemplate.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: weekTemplate.ownerId }
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
            value={formatDate(weekTemplate.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(weekTemplate.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
