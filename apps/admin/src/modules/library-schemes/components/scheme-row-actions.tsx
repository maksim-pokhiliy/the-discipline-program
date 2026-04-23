"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip } from "@mui/material";
import Link from "next/link";

import { type Scheme } from "@repo/contracts/library/scheme";

type SchemeRowActionsProps = {
  scheme: Scheme;
  onDelete: (id: string) => void;
};

export const SchemeRowActions = ({ scheme, onDelete }: SchemeRowActionsProps) => (
  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
    <Tooltip title="Edit">
      <IconButton
        component={Link}
        href={`/library/schemes/${scheme.id}`}
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
        onClick={() => onDelete(scheme.id)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  </Stack>
);
