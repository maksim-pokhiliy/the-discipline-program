"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import TuneIcon from "@mui/icons-material/Tune";
import { IconButton, Stack, Tooltip } from "@mui/material";

import type { NodeId } from "../compose-tree.types";

const INSPECT_TOOLTIP = "Edit";
const DUPLICATE_TOOLTIP = "Duplicate";
const DELETE_TOOLTIP = "Delete";

const tooltipChildSx = { display: "inline-flex" };

type ComposeNodeActionsProps = {
  nodeId: NodeId;
  isStructuralEditingAllowed: boolean;
  onInspect: (id: NodeId) => void;
  onDuplicate: (id: NodeId) => void;
  onDelete: (id: NodeId) => void;
};

export const ComposeNodeActions: React.FC<ComposeNodeActionsProps> = ({
  nodeId,
  isStructuralEditingAllowed,
  onInspect,
  onDuplicate,
  onDelete,
}) => (
  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
    <Tooltip title={INSPECT_TOOLTIP}>
      <span style={tooltipChildSx}>
        <IconButton size="small" aria-label={INSPECT_TOOLTIP} onClick={() => onInspect(nodeId)}>
          <TuneIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>

    {isStructuralEditingAllowed ? (
      <>
        <Tooltip title={DUPLICATE_TOOLTIP}>
          <span style={tooltipChildSx}>
            <IconButton
              size="small"
              aria-label={DUPLICATE_TOOLTIP}
              onClick={() => onDuplicate(nodeId)}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={DELETE_TOOLTIP}>
          <span style={tooltipChildSx}>
            <IconButton
              size="small"
              aria-label={DELETE_TOOLTIP}
              onClick={() => onDelete(nodeId)}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </>
    ) : null}
  </Stack>
);
