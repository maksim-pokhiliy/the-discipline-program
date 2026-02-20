import { api } from "@app/lib/api";
import { PlansListView } from "@app/modules/plans";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const initialData = await api.trainingPlans.getPageData();

  return <PlansListView initialData={initialData} />;
}
