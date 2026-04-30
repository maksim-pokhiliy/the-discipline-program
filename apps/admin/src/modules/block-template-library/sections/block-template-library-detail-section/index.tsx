"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type BlockTemplate } from "@repo/contracts/lms/block-template";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { BlockTemplateLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";

type BlockTemplateLibraryDetailSectionProps = {
  blockTemplate: BlockTemplate;
  isPending: boolean;
};

export const BlockTemplateLibraryDetailSection = ({
  blockTemplate,
  isPending,
}: BlockTemplateLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const ownerCoach = coaches?.find((c) => c.userId === blockTemplate.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{blockTemplate.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={blockTemplate.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[blockTemplate.scope]}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <BlockTemplateLibraryForm isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={blockTemplate.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {blockTemplate.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: blockTemplate.ownerId }
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
            value={formatDate(blockTemplate.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(blockTemplate.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
