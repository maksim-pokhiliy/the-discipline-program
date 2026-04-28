"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { type PlanStructureSegment } from "@repo/contracts/lms/training-plan";

import { type PlanSelection } from "./selection";
import { SetGroupGroup } from "./set-group-group";

export type SegmentRowProps = {
  segment: PlanStructureSegment;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

export const SegmentRow = ({ segment, selection, onSelect }: SegmentRowProps) => {
  const sortable = useSortable({
    id: `segment:${segment.id}`,
    data: { kind: "segment", segmentId: segment.id },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = selection?.kind === "segment" && selection.id === segment.id;
  const totalEntries = segment.setGroups.reduce((acc, sg) => acc + sg.entries.length, 0);

  return (
    <Stack
      ref={sortable.setNodeRef}
      style={style}
      spacing={0.5}
      sx={{
        py: 0.5,
        pl: 1,
        borderRadius: 1,
        bgcolor: isSelected ? "action.selected" : "transparent",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        onClick={() => onSelect({ kind: "segment", id: segment.id })}
        sx={{ cursor: "pointer" }}
      >
        <Box
          {...sortable.attributes}
          {...sortable.listeners}
          sx={{ cursor: "grab", display: "flex", color: "text.disabled" }}
          aria-label="Drag segment"
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Typography variant="body2" sx={{ flex: 1 }}>
          {segment.label ?? "Segment"}
        </Typography>
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
