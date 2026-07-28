import { type GetAthleteMovementsResponse } from "@repo/contracts/lms/exercise";

import {
  CATALOG_STATUS_ERROR,
  CATALOG_STATUS_LOADING,
  CATALOG_STATUS_READY,
} from "./athlete-records.constants";

export type MovementCatalogStatus =
  | typeof CATALOG_STATUS_LOADING
  | typeof CATALOG_STATUS_ERROR
  | typeof CATALOG_STATUS_READY;

export type MovementCatalogQueryState = {
  data: GetAthleteMovementsResponse | undefined;
  isLoading: boolean;
  error: Error | null;
};

export const toMovementCatalogStatus = ({
  data,
  isLoading,
  error,
}: MovementCatalogQueryState): MovementCatalogStatus => {
  if (error !== null && data === undefined) {
    return CATALOG_STATUS_ERROR;
  }

  if (isLoading) {
    return CATALOG_STATUS_LOADING;
  }

  return CATALOG_STATUS_READY;
};
