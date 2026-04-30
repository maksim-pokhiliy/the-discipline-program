"use client";

import { useDraggable } from "@dnd-kit/core";
import { Box, Stack, Typography } from "@mui/material";

import { type LibraryScope } from "@repo/contracts/lms/_domain";

export type TemplateKind = "block" | "session" | "week";

type DraggableTemplateListItemProps = {
  templateId: string;
  kind: TemplateKind;
  name: string;
  description?: string | null;
  scope?: LibraryScope;
};

export const DraggableTemplateListItem = ({
  templateId,
  kind,
  name,
  description,
  scope,
}: DraggableTemplateListItemProps) => {
  const draggableId = `template-${kind}:${templateId}`;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: { kind: `template-${kind}`, templateId },
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 1,
        cursor: isDragging ? "grabbing" : "grab",
        opacity: isDragging ? 0.5 : 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Stack spacing={0.25}>
        <Typography variant="body2" noWrap>
          {name}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {description}
          </Typography>
        )}
        {scope && (
          <Typography variant="caption" color="text.secondary">
            {scope}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
