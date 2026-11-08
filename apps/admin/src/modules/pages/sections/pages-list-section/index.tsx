import { type ReactElement, useMemo } from "react";

import { Stack } from "@mui/material";

import { type AdminPageListItem, PageSlug } from "@repo/contracts/cms/pages";
import { DataTable } from "@repo/ui";

import { LanguageBar } from "../../components/language-bar";
import { type EditorLocale } from "../../components/locale-gate";

import { pageColumns } from "./page-columns";

const PAGE_ORDER = Object.values(PageSlug);

const sortByPageOrder = (pages: AdminPageListItem[]): AdminPageListItem[] =>
  [...pages].sort((a, b) => PAGE_ORDER.indexOf(a.slug) - PAGE_ORDER.indexOf(b.slug));

type PagesListSectionProps = {
  pages: AdminPageListItem[];
  locale: EditorLocale;
};

export const PagesListSection = ({ pages, locale }: PagesListSectionProps): ReactElement => {
  const sortedPages = useMemo(() => sortByPageOrder(pages), [pages]);

  return (
    <Stack spacing={2}>
      <LanguageBar locale={locale} />
      <DataTable
        data={sortedPages}
        columns={pageColumns(locale)}
        emptyMessage="No marketing pages found."
      />
    </Stack>
  );
};
