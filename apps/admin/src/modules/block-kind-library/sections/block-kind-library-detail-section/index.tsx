"use client";

import { Chip, Stack, Typography, useTheme } from "@mui/material";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard, UserChip } from "@repo/ui";

import { useCoachesList } from "@app/lib/hooks";

import { BlockKindLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";

type BlockKindLibraryDetailSectionProps = {
  blockKind: BlockKind;
  isPending: boolean;
};

export const BlockKindLibraryDetailSection = ({
  blockKind,
  isPending,
}: BlockKindLibraryDetailSectionProps) => {
  const theme = useTheme();
  const { data: coaches } = useCoachesList();
  const ownerCoach = coaches?.find((c) => c.userId === blockKind.ownerId);

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1">{blockKind.name}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={blockKind.scope === "SYSTEM" ? "System" : "Coach"}
            color={SCOPE_CHIP_COLOR[blockKind.scope]}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>

      <BlockKindLibraryForm isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={blockKind.id} />
          <DetailField label="Owner" labelWidth={theme.spacing(12)}>
            {blockKind.ownerId ? (
              <UserChip
                user={
                  ownerCoach
                    ? {
                        id: ownerCoach.userId,
                        name: ownerCoach.name,
                        email: ownerCoach.email,
                      }
                    : { id: blockKind.ownerId }
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
            value={formatDate(blockKind.createdAt, "long")}
          />
          <DetailField
            label="Updated"
            labelWidth={theme.spacing(12)}
            value={formatDate(blockKind.updatedAt, "long")}
          />
        </Stack>
      </FormCard>
    </Stack>
  );
};
