import { type ReactElement } from "react";

import { usePageDetails } from "@app/lib/hooks";

import { PagesEditForm } from "./pages-edit-form";

export const PagesQueryFormFixture = ({ slug }: { slug: string }): ReactElement | null => {
  const { data } = usePageDetails(slug);

  return data ? <PagesEditForm page={data} /> : null;
};
