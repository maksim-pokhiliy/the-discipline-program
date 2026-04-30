"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { SchemeTemplateLibraryForm } from "../../components";
import { formatToken, SCOPE_CHIP_COLOR } from "../../constants";

type SchemeTemplateLibraryDetailSectionProps = {
  schemeTemplate: SchemeTemplate;
  isPending: boolean;
};

export const SchemeTemplateLibraryDetailSection = ({
  schemeTemplate,
  isPending,
}: SchemeTemplateLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const ownerCoach = coaches?.find((c) => c.userId === schemeTemplate.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{schemeTemplate.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={schemeTemplate.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[schemeTemplate.scope]}
            size="small"
            variant="outlined"
          />
          <Chip
            label={formatToken(schemeTemplate.archetypeKind)}
            color="default"
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <SchemeTemplateLibraryForm isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={schemeTemplate.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {schemeTemplate.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: schemeTemplate.ownerId }
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
            value={formatDate(schemeTemplate.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(schemeTemplate.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
