"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import {
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
import { Review } from "@repo/api";

interface ReviewRowProps {
  review: Review;
  program?: Review["program"];
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  isTogglingActive?: boolean;
  isTogglingFeatured?: boolean;
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
}: ReviewRowProps) => {
  const truncateText = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
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
