import { api } from "@app/lib/api";
import { StorefrontProgramsListView } from "@app/modules/storefront";

export const dynamic = "force-dynamic";

export default async function StorefrontProgramsPage() {
  const initialData = await api.storefront.getPageData();

  return <StorefrontProgramsListView initialData={initialData} />;
}
