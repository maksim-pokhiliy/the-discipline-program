"use client";

import { type MouseEvent } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { DecorationBadge } from "./decoration-badge";
import { useEffectivePlanDecorationContext } from "./effective-plan-decoration-context";
import { getDecorationStyles } from "./get-decoration-styles";
import { type PlanCanvasSelectArgs } from "./plan-canvas";
import { planSelectionContains, type PlanSelection } from "./selection";
import { SetGroupGroup } from "./set-group-group";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type SegmentRowProps = {
  segment: PlanStructureSegment;
  selection: PlanSelection | null;
  onSelect: (args: PlanCanvasSelectArgs) => void;
};

const isAdditive = (event: MouseEvent): boolean => event.shiftKey || event.metaKey || event.ctrlKey;

export const SegmentRow = ({ segment, selection, onSelect }: SegmentRowProps) => {
  const sortable = useSortable({
    id: `segment:${segment.id}`,
    data: { kind: "segment", segmentId: segment.id },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = planSelectionContains(selection, "segment", segment.id);
  const totalEntries = segment.setGroups.reduce((acc, sg) => acc + sg.entries.length, 0);
  const decoration = useEffectivePlanDecorationContext().getDecoration(segment.id);
  const decorationStyles = getDecorationStyles(decoration);
  const touchTargetSx = useTouchTargetSx();

  return (
    <Stack
      ref={sortable.setNodeRef}
      style={style}
      spacing={0.5}
      sx={[
        {
          py: 0.5,
          pl: 1,
          borderRadius: 1,
          bgcolor: isSelected ? "action.selected" : "transparent",
          outline: isSelected ? "2px solid" : "none",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
        },
        ...(Array.isArray(decorationStyles.sx) ? decorationStyles.sx : [decorationStyles.sx]),
      ]}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        onClick={(event) =>
          onSelect({ kind: "segment", id: segment.id, additive: isAdditive(event) })
        }
        sx={[{ cursor: "pointer" }, touchTargetSx]}
      >
        <Box
          {...sortable.attributes}
          {...sortable.listeners}
          sx={{ cursor: "grab", display: "flex", color: "text.muted" }}
          aria-label="Drag segment"
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          {segment.label ?? "Segment"}
        </Typography>
        <DecorationBadge styles={decorationStyles} />
        <Chip label={`${totalEntries} entries`} size="small" variant="outlined" />
      </Stack>

      {segment.setGroups.map((setGroup) => (
        <SetGroupGroup
          key={setGroup.id}
          setGroup={setGroup}
          selection={selection}
          onSelect={onSelect}
        />
      ))}
    </Stack>
  );
};
