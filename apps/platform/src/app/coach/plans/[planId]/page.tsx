import { SuspenseWrapper } from "@repo/ui";

import { PlanDetailView } from "@app/modules/plan-detail";
import { PlanEditorView } from "@app/modules/plan-editor";

type PlanDetailPageProps = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PlanDetailPage = async ({ params, searchParams }: PlanDetailPageProps) => {
  const { planId } = await params;
  const search = await searchParams;
  const tabRaw = search.tab;
  const tab = Array.isArray(tabRaw) ? tabRaw[0] : tabRaw;
  const view = tab === "athletes" ? "athletes" : "schedule";

  return (
    <SuspenseWrapper>
      {view === "athletes" ? (
        <PlanDetailView planId={planId} />
      ) : (
        <PlanEditorView planId={planId} />
      )}
    </SuspenseWrapper>
  );
};

export default PlanDetailPage;
