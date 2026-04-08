import { SuspenseWrapper } from "@repo/ui";

import { PlanDetailView } from "@app/modules/plan-detail";

export const dynamic = "force-dynamic";

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
