"use client";

import { Box, Stack, Typography, alpha } from "@mui/material";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { SchemaRowCard } from "./schema-row-card";

const FRAME_BORDER_ALPHA = 0.35;
const FRAME_BG_ALPHA = 0.03;
const FRAME_BORDER_RADIUS_FACTOR = 0.5;
const LABEL_PX_FACTOR = 1.5;
const LABEL_PY_FACTOR = 0.75;
const LABEL_BORDER_ALPHA = 0.25;
const LABEL_FALLBACK = "GROUP";
const FIRST_NOTE_INDEX = 0;

type RowGroupBoxProps = {
  group: RowGroup;
  members: SchemaRow[];
  planId: string;
  startDate: string;
  startIndex: number;
  isReorderPending: boolean;
};

export const RowGroupBox: React.FC<RowGroupBoxProps> = ({
  group,
  members,
  planId,
  startDate,
  startIndex,
  isReorderPending,
}) => {
  const label = group.notes?.[FIRST_NOTE_INDEX] ?? LABEL_FALLBACK;

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${alpha(theme.palette.primary.main, FRAME_BORDER_ALPHA)}`,
        borderRadius: theme.spacing(FRAME_BORDER_RADIUS_FACTOR),
        bgcolor: alpha(theme.palette.primary.main, FRAME_BG_ALPHA),
        overflow: "hidden",
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        sx={(theme) => ({
          px: theme.spacing(LABEL_PX_FACTOR),
          py: theme.spacing(LABEL_PY_FACTOR),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, LABEL_BORDER_ALPHA)}`,
        })}
      >
        <Typography variant="overline" color="primary.main">
          {label}
        </Typography>
      </Stack>

      <Stack>
        {members.map((member, offset) => (
          <SchemaRowCard
            key={member.id}
            row={member}
            planId={planId}
            startDate={startDate}
            index={startIndex + offset}
            isReorderPending={isReorderPending}
          />
        ))}
      </Stack>
    </Box>
  );
};
