"use client";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminPageListItem } from "@repo/contracts/pages";
import { DataTable, type Column, PanelSection, ContentSection } from "@repo/ui";

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

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
      render: (page) => <Typography variant="body2">{formatDate(page.updatedAt)}</Typography>,
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (page) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Edit Content">
            <IconButton component={Link} href={`/pages/${page.slug}`} size="small" color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <ContentSection backgroundColor="dark" title="Marketing Pages Overview">
      <PanelSection title="All Pages">
        <DataTable data={pages} columns={columns} emptyMessage="No marketing pages found." />
      </PanelSection>
    </ContentSection>
  );
};
