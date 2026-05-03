"use client";

import { useCallback, type MouseEvent } from "react";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";

import { type PlanStructureBlock } from "@repo/contracts/lms/training-plan";

import { DecorationBadge } from "./decoration-badge";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { SegmentList } from "./segment-list";
import { planSelectionContains, type PlanSelection } from "./selection";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type BlockTreeProps = {
  block: PlanStructureBlock;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

const isAdditive = (event: MouseEvent): boolean => event.shiftKey || event.metaKey || event.ctrlKey;

export const BlockTree = ({ block, selection, onSelect }: BlockTreeProps) => {
  const sortable = useSortable({
    id: `block:${block.id}`,
    data: { kind: "block", blockId: block.id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = planSelectionContains(selection, "block", block.id);
  const segmentIds = block.segments.map((s) => `segment:${s.id}`);
  const decoration = useEffectivePlanDecorationContext().getDecoration(block.id);
  const decorationStyles = getDecorationStyles(decoration);
  const touchTargetSx = useTouchTargetSx();

  const handleHeaderClick = useCallback(
    (event: MouseEvent) => onSelect({ kind: "block", id: block.id, additive: isAdditive(event) }),
    [block.id, onSelect],
  );

  return (
    <Paper
      ref={sortable.setNodeRef}
      style={style}
      variant="outlined"
      sx={[
        {
          p: 1,
          bgcolor: isSelected ? "action.selected" : "background.paper",
          outline: isSelected ? "2px solid" : "none",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
        },
        ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
      ]}
    >
      <Stack spacing={1}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          onClick={handleHeaderClick}
          sx={touchTargetSx}
        >
          <Box
            {...sortable.attributes}
            {...sortable.listeners}
            sx={{ cursor: "grab", display: "flex", color: "text.muted" }}
            aria-label="Drag block"
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ flex: 1, cursor: "pointer" }}>
            {block.title ?? "Block"}
          </Typography>
          <DecorationBadge styles={decorationStyles} />
          <Chip label={block.status} size="small" variant="outlined" />
        </Stack>

        <SortableContext items={segmentIds} strategy={verticalListSortingStrategy}>
          <SegmentList segments={block.segments} selection={selection} onSelect={onSelect} />
        </SortableContext>
      </Stack>
    </Paper>
  );
};
