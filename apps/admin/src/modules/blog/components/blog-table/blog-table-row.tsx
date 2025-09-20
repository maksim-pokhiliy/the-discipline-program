"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  alpha,
  Avatar,
  IconButton,
  Stack,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { BlogPost } from "@repo/api";
import Link from "next/link";

interface BlogTableRowProps {
  post: BlogPost;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
  onToggleFeatured: () => void;
  isTogglingPublish?: boolean;
  isTogglingFeatured?: boolean;
  isDragDisabled?: boolean;
  isDragging?: boolean;
}

export const BlogTableRow = ({
  post,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePublish,
  onToggleFeatured,
  isTogglingPublish = false,
  isTogglingFeatured = false,
  isDragDisabled = true,
  isDragging = false,
}: BlogTableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: post.id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isCurrentlyDragging ? 1000 : "auto",
  };

  const formatDate = (date: Date | null) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTags = (tags: string[]) => {
    if (tags.length === 0) {
      return "No tags";
    }

    if (tags.length <= 2) {
      return tags.join(", ");
    }

    return `${tags.slice(0, 2).join(", ")} +${tags.length - 2}`;
  };

  return (
    <TableRow
      hover={!isDragging}
      ref={setNodeRef}
      style={style}
      sx={(theme) => ({
        opacity: isCurrentlyDragging ? 0.5 : 1,
        backgroundColor: isCurrentlyDragging ? alpha(theme.palette.primary.main, 0.05) : "inherit",
        cursor: isCurrentlyDragging ? "grabbing" : "inherit",
      })}
    >
      <TableCell sx={{ width: 40 }}>
        <IconButton
          size="small"
          disabled={isDragDisabled}
          {...attributes}
          {...listeners}
          sx={{ cursor: isDragDisabled ? "not-allowed" : "grab" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar variant="rounded" src={post.coverImage} sx={{ width: 60, height: 40 }}>
            {post.title[0]}
          </Avatar>

          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {post.title}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxWidth: 300,
              }}
            >
              {post.excerpt || "No excerpt"}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2">{post.category}</Typography>

          <Typography variant="caption" color="text.secondary">
            {formatTags(post.tags)}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2">{post.author}</Typography>
      </TableCell>

      <TableCell>
        <Stack spacing={1} alignItems="flex-start">
          <Switch
            size="small"
            checked={post.isPublished}
            onChange={onTogglePublish}
            disabled={isTogglingPublish}
            color="success"
          />

          <Switch
            size="small"
            checked={post.isFeatured}
            onChange={onToggleFeatured}
            disabled={isTogglingFeatured}
            color="warning"
            icon={<StarIcon sx={{ fontSize: 16 }} />}
            checkedIcon={<StarIcon sx={{ fontSize: 16 }} />}
          />
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="caption">{formatDate(post.publishedAt)}</Typography>
      </TableCell>

      <TableCell>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {post.sortOrder}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={1}>
          {post.isPublished && (
            <Tooltip title="View on site">
              <IconButton
                size="small"
                component={Link}
                href={`${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`}
                target="_blank"
                color="primary"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

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
