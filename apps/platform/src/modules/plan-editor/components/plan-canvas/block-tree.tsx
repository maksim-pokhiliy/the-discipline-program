"use client";

import { useCallback } from "react";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Virtuoso } from "react-virtuoso";

import {
  type PlanStructureBlock,
  type PlanStructureSegment,
  type PlanStructureSetGroup,
} from "@repo/contracts/lms/training-plan";

import { type PlanSelection } from "./selection";

const VIRTUALIZE_THRESHOLD = 20;

type EntryRowProps = {
  setGroupId: string;
  entryId: string;
  exerciseName: string;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

const EntryRow = ({ entryId, exerciseName, selection, onSelect }: EntryRowProps) => {
  const sortable = useSortable({ id: `entry:${entryId}`, data: { kind: "entry", entryId } });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(sortable.transform),
    transition: sortable.transition,
  };
  const isSelected = selection?.kind === "entry" && selection.id === entryId;

  return (
    <Stack
      ref={sortable.setNodeRef}
      style={style}
      direction="row"
      alignItems="center"
      spacing={0.5}
      onClick={() => onSelect({ kind: "entry", id: entryId })}
      sx={{
        py: 0.5,
        pl: 1,
        borderRadius: 1,
        cursor: "pointer",
        bgcolor: isSelected ? "action.selected" : "transparent",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box
        {...sortable.attributes}
        {...sortable.listeners}
        sx={{ cursor: "grab", display: "flex", color: "text.disabled" }}
        aria-label="Drag entry"
      >
        <DragIndicatorIcon fontSize="inherit" />
      </Box>
      <Typography variant="caption">{exerciseName}</Typography>
    </Stack>
  );
};

type SetGroupGroupProps = {
  setGroup: PlanStructureSetGroup;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

const SetGroupGroup = ({ setGroup, selection, onSelect }: SetGroupGroupProps) => {
  const entryIds = setGroup.entries.map((entry) => `entry:${entry.id}`);

  return (
    <Stack spacing={0.25} sx={{ pl: 2 }}>
      <Typography variant="caption" color="text.secondary">
        SetGroup ×{setGroup.entries.length}
      </Typography>
      <SortableContext items={entryIds} strategy={verticalListSortingStrategy}>
        {setGroup.entries.map((entry) => {
          const exerciseName = (() => {
            const snapshot = entry.exerciseSnapshot;

            if (
              snapshot &&
              typeof snapshot === "object" &&
              "name" in snapshot &&
              typeof (snapshot as { name?: unknown }).name === "string"
            ) {
              return (snapshot as { name: string }).name;
            }

            return "Exercise";
          })();

          return (
            <EntryRow
              key={entry.id}
              setGroupId={setGroup.id}
              entryId={entry.id}
              exerciseName={exerciseName}
              selection={selection}
              onSelect={onSelect}
            />
          );
        })}
      </SortableContext>
    </Stack>
  );
};

type SegmentRowProps = {
  segment: PlanStructureSegment;
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
};

const SegmentRow = ({ segment, selection, onSelect }: SegmentRowProps) => {
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

const SegmentList = ({
  segments,
  selection,
  onSelect,
}: {
  segments: PlanStructureSegment[];
  selection: PlanSelection | null;
  onSelect: (selection: PlanSelection) => void;
}) => {
  if (segments.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
        No segments
      </Typography>
    );
  }

  if (segments.length > VIRTUALIZE_THRESHOLD) {
    return (
      <Virtuoso
        style={{ height: 320 }}
        totalCount={segments.length}
        itemContent={(index) => {
          const segment = segments[index];

          if (!segment) {
            return null;
          }

          return <SegmentRow segment={segment} selection={selection} onSelect={onSelect} />;
        }}
      />
    );
  }

  return (
    <Stack spacing={0.5}>
      {segments.map((segment) => (
        <SegmentRow key={segment.id} segment={segment} selection={selection} onSelect={onSelect} />
      ))}
    </Stack>
  );
};

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
