import { PlanDetailView } from "@app/modules/plan-detail";

export const dynamic = "force-dynamic";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const { planId } = await params;

  return <PlanDetailView planId={planId} />;
}
