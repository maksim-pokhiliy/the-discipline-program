import { api } from "@app/lib/api";
import { PagesListView } from "@app/modules/pages";

export const dynamic = "force-dynamic";

export default async function PagesListPage() {
  const initialData = await api.pages.getPages();

  return <PagesListView initialData={initialData} />;
}
