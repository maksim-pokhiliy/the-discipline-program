import { SuspenseWrapper } from "@repo/ui";

import { PlanEditorView } from "@app/modules/plan-editor";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

const PlanDetailPage = async ({ params }: PlanDetailPageProps) => {
  const { planId } = await params;

  return (
    <SuspenseWrapper>
      <PlanEditorView planId={planId} />
    </SuspenseWrapper>
  );
};

export default PlanDetailPage;
