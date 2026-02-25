import { serverApi } from "@app/lib/api/server";
import { PagesListView } from "@app/modules/pages";

export const dynamic = "force-dynamic";

export default async function PagesListPage() {
  const initialData = await serverApi.pages.getPages();

  return <PagesListView initialData={initialData} />;
}
