"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import {
  alpha,
  Chip,
  IconButton,
  Stack,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Program } from "@repo/api";

interface ProgramRowProps {
  program: Program;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  isToggling?: boolean;
  isDragDisabled?: boolean;
  isDragging?: boolean;
}

export const ProgramRow = ({
  program,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isToggling = false,
  isDragDisabled = true,
  isDragging = false,
}: ProgramRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: program.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isCurrentlyDragging ? 1000 : "auto",
  };

  const formatFeatures = (features: string[]) => {
    if (features.length === 0) return "No features";

    if (features.length <= 3) {
      return features.join(", ");
    }

    const visible = features.slice(0, 2);
    const remaining = features.length - 2;

    return `${visible.join(", ")} and ${remaining} more`;
  };

  const truncateDescription = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;

    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <TableRow
      hover={!isDragging}
      ref={setNodeRef}
      style={style}
      sx={(theme) => ({
        opacity: isCurrentlyDragging ? 0.5 : 1,
        backgroundColor: isCurrentlyDragging ? alpha(theme.palette.primary.main, 0.1) : "inherit",
      })}
    >
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          {!isDragDisabled && (
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{
                cursor: "grab",
                "&:active": { cursor: "grabbing" },
                color: "text.secondary",
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          )}

          <Stack>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {program.name}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              /{program.slug}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title={program.description}>
          <Typography variant="body2" color="text.secondary">
            {truncateDescription(program.description)}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          ${program.price}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {program.currency}
        </Typography>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={program.isActive}
            onChange={onToggleStatus}
            disabled={isToggling}
            size="small"
          />

          <Chip
            label={program.isActive ? "Active" : "Inactive"}
            color={program.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title={program.features.join(", ")}>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
            {formatFeatures(program.features)}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {program.sortOrder}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1}>
          <Tooltip title="Duplicate program">
            <IconButton size="small" onClick={onDuplicate} color="primary">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit program">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete program">
            <IconButton size="small" onClick={onDelete} color="primary">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};
