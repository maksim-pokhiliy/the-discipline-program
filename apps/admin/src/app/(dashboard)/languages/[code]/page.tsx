import { type ReactElement } from "react";

import { LanguagesEditView } from "@app/modules/languages";

type PageProps = { params: Promise<{ code: string }> };

const LanguagesEditPage = async ({ params }: PageProps): Promise<ReactElement> => {
  const { code } = await params;

  return <LanguagesEditView code={code} />;
};

export default LanguagesEditPage;
