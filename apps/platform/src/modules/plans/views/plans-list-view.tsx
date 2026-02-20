"use client";

import type { CoachPlansPageData } from "@repo/contracts/training-plan";
import { QueryWrapper } from "@repo/query";

import { useTrainingPlansPageData } from "@app/lib/hooks";

import { PlansListSection } from "../sections/plans-list-section";

type PlansListViewProps = {
  initialData: CoachPlansPageData;
};

export const PlansListView = ({ initialData }: PlansListViewProps) => {
  const { data, isLoading, error } = useTrainingPlansPageData({ initialData });

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage="Loading plans...">
      {(pageData) => <PlansListSection plans={pageData.plans} />}
    </QueryWrapper>
  );
};
