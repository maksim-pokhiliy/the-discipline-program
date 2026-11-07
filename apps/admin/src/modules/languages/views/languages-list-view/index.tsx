"use client";

import { type ReactElement } from "react";

import { AdminListView } from "@app/lib/components/admin-list-view";
import { useLocales } from "@app/lib/hooks";

import { LanguagesListSection } from "../../sections";

export const LanguagesListView = (): ReactElement => (
  <AdminListView
    queryResult={useLocales()}
    loadingMessage="Loading languages..."
    title="Languages"
    subtitle="Languages of the marketing site and their translation progress"
  >
    {(locales) => <LanguagesListSection locales={locales} />}
  </AdminListView>
);
