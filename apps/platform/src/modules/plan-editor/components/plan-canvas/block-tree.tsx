"use client";

import { useCallback } from "react";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import { type PlanStructureBlock } from "@repo/contracts/lms/training-plan";

import { SegmentList } from "./segment-list";
import { type PlanSelection } from "./selection";

export type BlockTreeProps = {
  block: PlanStructureBlock;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

export const BlockTree = ({ block, selection, onSelect }: BlockTreeProps) => {
  const sortable = useSortable({
    id: `block:${block.id}`,
    data: { kind: "block", blockId: block.id },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = selection?.kind === "block" && selection.id === block.id;
  const segmentIds = block.segments.map((s) => `segment:${s.id}`);

  const handleHeaderClick = useCallback(
    () => onSelect({ kind: "block", id: block.id }),
    [block.id, onSelect],
  );

  return (
    <Paper
      ref={sortable.setNodeRef}
      style={style}
      variant="outlined"
      sx={{
        p: 1,
        bgcolor: isSelected ? "action.selected" : "background.paper",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={0.5} onClick={handleHeaderClick}>
          <Box
            {...sortable.attributes}
            {...sortable.listeners}
            sx={{ cursor: "grab", display: "flex", color: "text.disabled" }}
            aria-label="Drag block"
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ flex: 1, cursor: "pointer" }}>
            {block.title ?? "Block"}
          </Typography>
          <Chip label={block.status} size="small" variant="outlined" />
        </Stack>

        <SortableContext items={segmentIds} strategy={verticalListSortingStrategy}>
          <SegmentList segments={block.segments} selection={selection} onSelect={onSelect} />
        </SortableContext>
      </Stack>
    </Paper>
  );
};
