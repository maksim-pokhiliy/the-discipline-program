"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip } from "@mui/material";
import Link from "next/link";

import { type BlockType } from "@repo/contracts/library/block-type";

type BlockTypeRowActionsProps = {
  blockType: BlockType;
  onDelete: (id: string) => void;
};

export const BlockTypeRowActions = ({ blockType, onDelete }: BlockTypeRowActionsProps) => (
  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
    <Tooltip title="Edit">
      <IconButton
        component={Link}
        href={`/library/block-types/${blockType.id}`}
        color="primary"
        aria-label="Edit"
        size="small"
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete">
      <IconButton
        color="error"
        aria-label="Delete"
        size="small"
        onClick={() => onDelete(blockType.id)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);
