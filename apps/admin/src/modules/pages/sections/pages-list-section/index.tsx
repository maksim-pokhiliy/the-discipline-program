"use client";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminPageListItem } from "@repo/contracts/pages";
import { formatDate } from "@repo/shared";
import { DataTable, type Column } from "@repo/ui";

interface PagesListSectionProps {
  pages: AdminPageListItem[];
}

export const PagesListSection = ({ pages }: PagesListSectionProps) => {
  const columns: Column<AdminPageListItem>[] = [
    {
      id: "id",
      label: "Page Name",
      width: "60%",
      render: (page) => (
        <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>
          {page.slug} Page
        </Typography>
      ),
    },
    {
      id: "updatedAt",
      label: "Last Updated",
      width: "30%",
      render: (page) => (
        <Typography variant="body2">{formatDate(page.updatedAt, "medium")}</Typography>
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (page) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit Content">
            <IconButton component={Link} href={`/pages/${page.slug}`} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <DataTable
      data={pages}
      columns={columns}
      title="Pages"
      emptyMessage="No marketing pages found."
    />
  );
};
