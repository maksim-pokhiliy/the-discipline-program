import { PlanEditView } from "@app/modules/plans";

type PageProps = {
  params: Promise<{ planId: string }>;
};

export default async function PlanEditPage({ params }: PageProps) {
  const { planId } = await params;

  return <PlanEditView planId={planId} />;
}
