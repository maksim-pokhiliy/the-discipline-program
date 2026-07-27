"use client";

import { type ReactElement } from "react";

import { QueryWrapper } from "@repo/ui";

import { useAthleteRecords } from "@app/lib/hooks/use-athlete-records";
import { useAthleteMovements } from "@app/lib/hooks/use-exercises";

import { RecordsContent } from "../components/records-content";
import { LOADING_LABEL } from "../utils/athlete-records.constants";

export type AthleteRecordsViewProps = Record<string, never>;

export const AthleteRecordsView = (): ReactElement => {
  const { data, isLoading, error } = useAthleteRecords();
  const movementCatalog = useAthleteMovements();

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage={LOADING_LABEL}>
      {(loaded) => <RecordsContent data={loaded} movementCatalog={movementCatalog.data} />}
    </QueryWrapper>
  );
};
