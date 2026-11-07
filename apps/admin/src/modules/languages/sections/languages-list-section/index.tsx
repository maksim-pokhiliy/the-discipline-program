"use client";

import { type ReactElement } from "react";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { DataTable, EmptyState } from "@repo/ui";

import { CreateButton } from "@app/lib/components/create-button";
import { useNavigate } from "@app/lib/hooks";

import { DeleteLanguageModal, toLanguageRows } from "../../components";
import { LANGUAGE_CREATE_PATH } from "../../constants";

import { useLanguageColumns } from "./use-language-columns";
import { useLanguageListActions } from "./use-language-list-actions";

type LanguagesListSectionProps = { locales: AdminLocaleListItem[] };

export const LanguagesListSection = ({ locales }: LanguagesListSectionProps): ReactElement => {
  const navigate = useNavigate();
  const actions = useLanguageListActions(locales);
  const columns = useLanguageColumns(actions);

  return (
    <>
      <DataTable
        data={toLanguageRows(locales)}
        columns={columns}
        action={<CreateButton href={LANGUAGE_CREATE_PATH}>Create Language</CreateButton>}
      />
      {locales.every((locale) => locale.isDefault) && (
        <EmptyState
          message="The site is in English only. Add a language to start translating it."
          action={{ label: "Create Language", onClick: () => navigate(LANGUAGE_CREATE_PATH) }}
        />
      )}
      <DeleteLanguageModal
        language={actions.deleteLanguage}
        error={actions.deleteError}
        isDeleting={actions.isDeleting}
        onConfirm={actions.confirmDelete}
        onClose={actions.closeDelete}
      />
    </>
  );
};
