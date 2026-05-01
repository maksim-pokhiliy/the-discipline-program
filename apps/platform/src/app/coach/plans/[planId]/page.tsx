import { SuspenseWrapper } from "@repo/ui";

import { PlanEditorLoader } from "./plan-editor-loader";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
};

const PlanDetailPage = async ({ params }: PlanDetailPageProps) => {
  const { planId } = await params;

  return (
    <SuspenseWrapper>
      <PlanEditorLoader planId={planId} />
    </SuspenseWrapper>
  );
};

export default PlanDetailPage;
