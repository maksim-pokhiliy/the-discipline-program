import { PlanDetailView } from "@app/modules/plan-detail";

type PlanDetailPageProps = { params: Promise<{ planId: string }> };

const PlanDetailPage = async ({ params }: PlanDetailPageProps) => {
  const { planId } = await params;

  return <PlanDetailView planId={planId} />;
};

export default PlanDetailPage;
