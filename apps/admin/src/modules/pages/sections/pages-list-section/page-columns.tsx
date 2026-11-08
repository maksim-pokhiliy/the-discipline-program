import EditIcon from "@mui/icons-material/Edit";
import { IconButton, Tooltip, Typography } from "@mui/material";
import Link from "next/link";

import { type AdminPageListItem } from "@repo/contracts/cms/pages";
import { formatDate } from "@repo/shared";
import { type Column } from "@repo/ui";

import { type EditorLocale } from "../../components/locale-gate";
import { PageTranslationProgress } from "../../components/page-translation-progress";
import { pageEditHref } from "../../config/locale-url";
import { PAGE_LABELS } from "../../config/page-labels";
import { pageSectionCount } from "../../config/page-section-count";

const translationColumn: Column<AdminPageListItem> = {
  id: "translatedSectionCount",
  label: "Translation",
  render: (page) => (
    <PageTranslationProgress
      pageLabel={PAGE_LABELS[page.slug]}
      translatedCount={page.translatedSectionCount ?? 0}
      sectionCount={pageSectionCount(page.slug)}
    />
  ),
};

export const pageColumns = (locale: EditorLocale): Column<AdminPageListItem>[] => [
  {
    id: "id",
    label: "Page Name",
    render: (page) => <Typography variant="subtitle2">{PAGE_LABELS[page.slug]}</Typography>,
  },
  ...(locale.isDefault ? [] : [translationColumn]),
  {
    id: "updatedAt",
    label: "Last Updated",
    render: (page) => (
      <Typography variant="body2">{formatDate(page.updatedAt, "medium")}</Typography>
    ),
  },
  {
    id: "actions",
    label: "Actions",
    align: "right",
    render: (page) => (
      <Tooltip title="Edit Content">
        <IconButton
          component={Link}
          href={pageEditHref(page.slug, locale.code)}
          color="primary"
          aria-label="Edit content"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),
  },
];
