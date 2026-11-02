import { type ReactElement, useMemo } from "react";

import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminPageListItem, PageSlug } from "@repo/contracts/cms/pages";
import { formatDate } from "@repo/shared";
import { DataTable, type Column } from "@repo/ui";

import { PAGE_LABELS } from "../../config/page-labels";

const PAGE_ORDER = Object.values(PageSlug);

const sortByPageOrder = (pages: AdminPageListItem[]): AdminPageListItem[] =>
  [...pages].sort((a, b) => PAGE_ORDER.indexOf(a.slug) - PAGE_ORDER.indexOf(b.slug));

const columns: Column<AdminPageListItem>[] = [
  {
    id: "id",
    label: "Page Name",
    width: "60%",
    render: (page) => <Typography variant="subtitle2">{PAGE_LABELS[page.slug]}</Typography>,
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
          <IconButton
            component={Link}
            href={`/pages/${page.slug}`}
            color="primary"
            aria-label="Edit content"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    ),
  },
];

type PagesListSectionProps = {
  pages: AdminPageListItem[];
};

export const PagesListSection = ({ pages }: PagesListSectionProps): ReactElement => {
  const sortedPages = useMemo(() => sortByPageOrder(pages), [pages]);

  return (
    <DataTable data={sortedPages} columns={columns} emptyMessage="No marketing pages found." />
  );
};
