import { SuspenseWrapper } from "@repo/ui";

import { PlanDetailView } from "@app/modules/plan-detail";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

const PlanDetailPage = async ({ params }: PlanDetailPageProps) => {
  const { planId } = await params;

  return (
    <SuspenseWrapper>
      <PlanDetailView planId={planId} />
    </SuspenseWrapper>
  );
};

export default PlanDetailPage;
