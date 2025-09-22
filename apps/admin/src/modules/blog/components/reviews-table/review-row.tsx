"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import {
  alpha,
  Avatar,
  Chip,
  IconButton,
  Rating,
  Stack,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { Program, Review } from "@repo/api";

interface ReviewRowProps {
  review: Review;
  program?: Program;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  isTogglingActive?: boolean;
  isTogglingFeatured?: boolean;
  isDragDisabled?: boolean;
  isDragging?: boolean;
}

export const ReviewRow = ({
  review,
  program,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  onToggleFeatured,
  isTogglingActive = false,
  isTogglingFeatured = false,
  isDragDisabled = true,
  isDragging = false,
}: ReviewRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: review.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isCurrentlyDragging ? 1000 : "auto",
  };

  const truncateText = (text: string, maxLength = 100) => {
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

          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={review.authorAvatar ?? ""}
              alt={review.authorName}
              sx={{ width: 40, height: 40 }}
            />

            <Stack>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {review.authorName}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {review.authorRole}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>
        <Tooltip title={review.text}>
          <Typography variant="body2" color="text.secondary">
            {truncateText(review.text)}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Rating value={review.rating} readOnly size="small" />
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={review.isActive}
            onChange={onToggleActive}
            disabled={isTogglingActive}
            size="small"
          />

          <Chip
            label={review.isActive ? "Active" : "Inactive"}
            color={review.isActive ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={review.isFeatured}
            onChange={onToggleFeatured}
            disabled={isTogglingFeatured}
            size="small"
            color="secondary"
          />

          {review.isFeatured && (
            <Chip
              label="Featured"
              color="secondary"
              size="small"
              icon={<StarIcon fontSize="small" />}
              variant="filled"
            />
          )}
        </Stack>
      </TableCell>

      <TableCell>
        {program ? (
          <Chip label={program.name} size="small" variant="outlined" color="primary" />
        ) : (
          <Typography variant="caption" color="text.disabled">
            No program
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {review.sortOrder}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1}>
          <Tooltip title="Duplicate review">
            <IconButton size="small" onClick={onDuplicate} color="primary">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit review">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete review">
            <IconButton size="small" onClick={onDelete} color="primary">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};
