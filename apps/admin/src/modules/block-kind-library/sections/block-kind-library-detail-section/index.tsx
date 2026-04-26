"use client";

import { useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";

import { type BlockKind } from "@repo/contracts/lms/block-kind";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { BlockKindLibraryForm } from "../../components";
import { SCOPE_CHIP_COLOR } from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

type BlockKindLibraryDetailSectionProps = {
  blockKind: BlockKind;
  isPending: boolean;
};

export const BlockKindLibraryDetailSection = ({
  blockKind,
  isPending,
}: BlockKindLibraryDetailSectionProps) => {
  const theme = useTheme();
  const [promoteTarget, setPromoteTarget] = useState<{ blockKind: BlockKind } | null>(null);
  const [demoteTarget, setDemoteTarget] = useState<{ blockKind: BlockKind } | null>(null);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
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

        {blockKind.scope === "COACH" ? (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setPromoteTarget({ blockKind })}
            disabled={isPending}
          >
            Promote to SYSTEM
          </Button>
        ) : (
          <Button
            type="button"
            variant="outlined"
            color="warning"
            startIcon={<ArrowDownwardIcon />}
            onClick={() => setDemoteTarget({ blockKind })}
            disabled={isPending}
          >
            Demote to COACH
          </Button>
        )}
      </Stack>

      <BlockKindLibraryForm isEdit isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={blockKind.id} />
          <DetailField
            label="Owner"
            labelWidth={theme.spacing(12)}
            value={blockKind.ownerId ?? "—"}
          />
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

      <PromoteDemoteSection
        promoteTarget={promoteTarget}
        demoteTarget={demoteTarget}
        onClose={() => {
          setPromoteTarget(null);
          setDemoteTarget(null);
        }}
      />
    </Stack>
  );
};
