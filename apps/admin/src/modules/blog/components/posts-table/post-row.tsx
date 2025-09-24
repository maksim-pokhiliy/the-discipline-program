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
  Chip,
  IconButton,
  Stack,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { AdminBlogPost } from "@repo/api";

import { formatPublishedAt } from "@app/modules/blog/utils";

interface PostRowProps {
  post: AdminBlogPost;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  isTogglingPublished?: boolean;
  isTogglingFeatured?: boolean;
  isDragDisabled?: boolean;
  isDragging?: boolean;
}

export const PostRow = ({
  post,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublished,
  onToggleFeatured,
  isTogglingPublished = false,
  isTogglingFeatured = false,
  isDragDisabled = true,
  isDragging = false,
}: PostRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: post.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isCurrentlyDragging ? 1000 : "auto",
  } as const;

  return (
    <TableRow
      hover={!isDragging}
      ref={setNodeRef}
      style={style}
      sx={(theme) => ({
        opacity: isCurrentlyDragging ? 0.5 : 1,
        backgroundColor: isCurrentlyDragging ? alpha(theme.palette.primary.main, 0.08) : "inherit",
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
              {post.title}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
              {post.slug}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>
        <Chip label={post.category} size="small" variant="outlined" color="primary" />
      </TableCell>

      <TableCell>
        <Typography variant="body2">{post.author}</Typography>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={post.isPublished}
            onChange={onTogglePublished}
            disabled={isTogglingPublished}
            size="small"
          />
          <Chip
            label={post.isPublished ? "Published" : "Draft"}
            color={post.isPublished ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Switch
            checked={post.isFeatured}
            onChange={onToggleFeatured}
            disabled={isTogglingFeatured}
            size="small"
            color="secondary"
          />

          {post.isFeatured && (
            <Chip
              label="Featured"
              color="secondary"
              size="small"
              icon={<StarIcon fontSize="small" />}
            />
          )}
        </Stack>
      </TableCell>

      <TableCell>
        {post.tags.length > 0 ? (
          <Stack direction="row" gap={0.5} flexWrap="wrap">
            {post.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Stack>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: "nowrap" }}>
            No tags
          </Typography>
        )}
      </TableCell>

      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
            {formatPublishedAt(post.publishedAt)}
          </Typography>
          {post.readTime ? (
            <Typography variant="caption" color="text.secondary">
              {post.readTime} min read
            </Typography>
          ) : null}
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {post.sortOrder}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1}>
          <Tooltip title="Duplicate post">
            <IconButton size="small" onClick={onDuplicate} color="primary">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit post">
            <IconButton size="small" onClick={onEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete post">
            <IconButton size="small" onClick={onDelete} color="primary">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};
