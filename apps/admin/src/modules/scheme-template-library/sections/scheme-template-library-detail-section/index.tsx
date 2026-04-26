"use client";

import { useState } from "react";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";

import { type SchemeTemplate } from "@repo/contracts/lms/scheme-template";
import { formatDate } from "@repo/shared";
import { DetailField, FormCard } from "@repo/ui";

import { SchemeTemplateLibraryForm } from "../../components";
import { formatToken, SCOPE_CHIP_COLOR } from "../../constants";
import { PromoteDemoteSection } from "../promote-demote-section";

type SchemeTemplateLibraryDetailSectionProps = {
  schemeTemplate: SchemeTemplate;
  isPending: boolean;
};

export const SchemeTemplateLibraryDetailSection = ({
  schemeTemplate,
  isPending,
}: SchemeTemplateLibraryDetailSectionProps) => {
  const theme = useTheme();
  const [promoteTarget, setPromoteTarget] = useState<{ schemeTemplate: SchemeTemplate } | null>(
    null,
  );
  const [demoteTarget, setDemoteTarget] = useState<{ schemeTemplate: SchemeTemplate } | null>(null);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
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

        {schemeTemplate.scope === "COACH" ? (
          <Button
            type="button"
            variant="outlined"
            color="primary"
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setPromoteTarget({ schemeTemplate })}
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
            onClick={() => setDemoteTarget({ schemeTemplate })}
            disabled={isPending}
          >
            Demote to COACH
          </Button>
        )}
      </Stack>

      <SchemeTemplateLibraryForm isEdit isLoading={isPending} />

      <FormCard title="Metadata">
        <Stack spacing={2}>
          <DetailField label="ID" labelWidth={theme.spacing(12)} value={schemeTemplate.id} />
          <DetailField
            label="Owner"
            labelWidth={theme.spacing(12)}
            value={schemeTemplate.ownerId ?? "—"}
          />
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
