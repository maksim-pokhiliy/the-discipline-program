"use client";

import { type ReactElement } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, MenuItem, Select, Stack, Typography } from "@mui/material";

import { SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import {
  PARALLEL_INTERLEAVE_ORDERS,
  type ParallelInterleaveOrder,
  type SchemaGroup,
} from "@repo/contracts/lms/schema-group";
import { AccentGroupCard, InlineEditText } from "@repo/ui";

import { useUpdateGroup } from "@app/lib/hooks";

import { type BlockCtx } from "../lib/build-cascade-chips";

import { AddSubSchemaButton } from "./add-sub-schema-button";
import { SchemaCard } from "./schema-card";

const GROUP_BOX_TEST_ID = "schema-group-box";
const BOX_LABEL_ARIA = "Group label";
const BOX_LABEL_PLACEHOLDER = "group…";
const INTERLEAVE_ARIA = "Interleave order";
const INTERLEAVE_PREFIX = "interleave:";
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;

const INTERLEAVE_ORDER_LABELS: Record<ParallelInterleaveOrder, string> = {
  round_by_round: "round by round",
  track_by_track: "track by track",
};

type SchemaGroupBoxProps = {
  group: SchemaGroup;
  members: SchemaWithBody[];
  planId: string;
  startDate: string;
  blockCtx: BlockCtx;
  parentIsReorderPending?: boolean;
};

export const SchemaGroupBox: React.FC<SchemaGroupBoxProps> = ({
  group,
  members,
  planId,
  startDate,
  blockCtx,
  parentIsReorderPending = false,
}): ReactElement => {
  const updateGroup = useUpdateGroup(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group:${group.id}`,
    disabled: parentIsReorderPending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const handleLabelCommit = (next: string) => {
    const trimmed = next.trim();
    const nextLabel = trimmed === "" ? null : trimmed;

    if (nextLabel === group.label) {
      return;
    }

    updateGroup.mutate({ groupId: group.id, data: { label: nextLabel } });
  };

  const handleInterleaveChange = (next: ParallelInterleaveOrder) => {
    if (next === group.interleaveOrder) {
      return;
    }

    updateGroup.mutate({ groupId: group.id, data: { interleaveOrder: next } });
  };

  const header = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      {...attributes}
      {...listeners}
    >
      <InlineEditText
        value={group.label ?? ""}
        onCommit={handleLabelCommit}
        variant="h4"
        ariaLabel={BOX_LABEL_ARIA}
        emptyIsValid
        maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
        placeholder={BOX_LABEL_PLACEHOLDER}
        sx={{ flex: 1, minWidth: 0 }}
      />

      <Typography variant="caption" color="text.subtle">
        {INTERLEAVE_PREFIX}
      </Typography>

      <Select
        value={group.interleaveOrder}
        onChange={(event) => handleInterleaveChange(event.target.value as ParallelInterleaveOrder)}
        size="small"
        variant="standard"
        disableUnderline
        aria-label={INTERLEAVE_ARIA}
        disabled={updateGroup.isPending}
        sx={{ fontSize: "caption.fontSize" }}
      >
        {PARALLEL_INTERLEAVE_ORDERS.map((order) => (
          <MenuItem key={order} value={order}>
            {INTERLEAVE_ORDER_LABELS[order]}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );

  return (
    <Box ref={setNodeRef} style={style} data-testid={GROUP_BOX_TEST_ID}>
      <AccentGroupCard header={header}>
        <Stack direction="column" spacing={0.75}>
          {members.map((member) => (
            <SchemaCard
              key={member.schema.id}
              schema={member}
              planId={planId}
              startDate={startDate}
              blockCtx={blockCtx}
              parentIsReorderPending={parentIsReorderPending}
              isBoxed
            />
          ))}

          <AddSubSchemaButton
            planId={planId}
            startDate={startDate}
            blockId={group.blockId}
            groupId={group.id}
          />
        </Stack>
      </AccentGroupCard>
    </Box>
  );
};
