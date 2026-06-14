"use client";

import { type ReactElement } from "react";

import { Box } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";

import { SchemaCard } from "./schema-card";

type GroupTrackWrapperProps = {
  member: SchemaWithBody;
  planId: string;
  startDate: string;
  parentIsReorderPending: boolean;
};

export const GroupTrackWrapper: React.FC<GroupTrackWrapperProps> = ({
  member,
  planId,
  startDate,
  parentIsReorderPending,
}): ReactElement => (
  <Box sx={{ minWidth: 0 }}>
    <SchemaCard
      schema={member}
      planId={planId}
      startDate={startDate}
      parentIsReorderPending={parentIsReorderPending}
      isBoxed
      isDraggable
    />
  </Box>
);
