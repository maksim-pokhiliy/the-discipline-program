"use client";

import { type ReactElement } from "react";

import { Box } from "@mui/material";

import { type Intensity } from "@repo/contracts/lms/_shared";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { SchemaCard } from "./schema-card";

type GroupTrackWrapperProps = {
  member: SchemaWithBody;
  planId: string;
  startDate: string;
  blockIntensity?: Intensity | null;
  parentIsReorderPending: boolean;
};

export const GroupTrackWrapper: React.FC<GroupTrackWrapperProps> = ({
  member,
  planId,
  startDate,
  blockIntensity = null,
  parentIsReorderPending,
}): ReactElement => (
  <Box sx={{ minWidth: 0 }}>
    <SchemaCard
      schema={member}
      planId={planId}
      startDate={startDate}
      blockIntensity={blockIntensity}
      parentIsReorderPending={parentIsReorderPending}
      isBoxed
      isDraggable
    />
  </Box>
);
