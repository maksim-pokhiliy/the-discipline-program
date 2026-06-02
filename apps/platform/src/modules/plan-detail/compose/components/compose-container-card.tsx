"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { alpha, Box, IconButton, Stack, Typography } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import { InlineEditText } from "@repo/ui";

import type { ComposeContainer, ComposeNode, NodeId } from "../compose-tree.types";
import { formatAxesSummary } from "../lib/axes-summary";

import { ComposeAddNodeMenu } from "./compose-add-node-menu";
import type { NodeHandlers } from "./compose-canvas-handlers";
import { ComposeNodeActions } from "./compose-node-actions";
import { ComposeRowCard } from "./compose-row-card";
import { ComposeTreeDnd } from "./compose-tree-dnd";

const BORDER_RADIUS_FACTOR = 0.5;
const HEAD_PX = 1.5;
const HEAD_PY = 1.25;
const HEAD_SPACING = 1.25;
const BODY_PL = 3.75;
const BODY_PR = 1.5;
const BODY_PB = 1.25;
const BODY_PT = 0.5;
const BODY_SPACING = 0.75;
const SELECTED_BORDER_ALPHA = 0.6;
const SELECTED_BG_ALPHA = 0.03;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const DRAG_ARIA = "Drag group";
const HEADER_ARIA = "Group header";
const HEADER_PLACEHOLDER = "group…";

type ComposeContainerCardProps = {
  container: ComposeContainer;
  exerciseById: Map<string, Exercise>;
  handlers: NodeHandlers;
  onRename: (id: NodeId, header: string) => void;
};

export const ComposeContainerCard: React.FC<ComposeContainerCardProps> = ({
  container,
  exerciseById,
  handlers,
  onRename,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: container.id,
  });

  const isSelected = container.id === handlers.selectedNodeId;
  const axesSummary = formatAxesSummary(container);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const renderChild = (child: ComposeNode) =>
    child.nodeType === "container" ? (
      <ComposeContainerCard
        key={child.id}
        container={child}
        exerciseById={exerciseById}
        handlers={handlers}
        onRename={onRename}
      />
    ) : (
      <ComposeRowCard
        key={child.id}
        row={child}
        exerciseById={exerciseById}
        isSelected={child.id === handlers.selectedNodeId}
        onSelect={handlers.onSelect}
        onDuplicate={handlers.onDuplicateNode}
        onDelete={handlers.onDeleteNode}
      />
    );

  return (
    <Stack
      ref={setNodeRef}
      style={style}
      direction="column"
      onClick={() => handlers.onSelect(container.id)}
      sx={(theme) => ({
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, SELECTED_BG_ALPHA)
          : "background.paper",
        border: 1,
        borderColor: isSelected
          ? alpha(theme.palette.primary.main, SELECTED_BORDER_ALPHA)
          : "divider",
        borderRadius: theme.spacing(BORDER_RADIUS_FACTOR),
        overflow: "hidden",
      })}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={HEAD_SPACING}
        sx={{ px: HEAD_PX, py: HEAD_PY, minWidth: 0 }}
      >
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          aria-label={DRAG_ARIA}
          onClick={(event) => event.stopPropagation()}
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Stack direction="column" spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Box onClick={(event) => event.stopPropagation()}>
            <InlineEditText
              value={container.header ?? ""}
              onCommit={(next) => onRename(container.id, next)}
              variant="h4"
              ariaLabel={HEADER_ARIA}
              emptyIsValid
              placeholder={HEADER_PLACEHOLDER}
            />
          </Box>

          {axesSummary !== "" ? (
            <Typography variant="caption" color="text.subtle">
              {axesSummary}
            </Typography>
          ) : null}
        </Stack>

        <Box onClick={(event) => event.stopPropagation()}>
          <ComposeNodeActions
            nodeId={container.id}
            onInspect={handlers.onSelect}
            onDuplicate={handlers.onDuplicateNode}
            onDelete={handlers.onDeleteNode}
          />
        </Box>
      </Stack>

      <Stack
        direction="column"
        spacing={BODY_SPACING}
        onClick={(event) => event.stopPropagation()}
        sx={{ pl: BODY_PL, pr: BODY_PR, pb: BODY_PB, pt: BODY_PT }}
      >
        <ComposeTreeDnd
          parentId={container.id}
          nodes={container.children}
          onReorder={handlers.onReorderChildren}
          renderChild={renderChild}
        />

        <ComposeAddNodeMenu
          parentId={container.id}
          onAddContainer={handlers.onAddContainer}
          onAddRow={handlers.onAddRow}
        />
      </Stack>
    </Stack>
  );
};
