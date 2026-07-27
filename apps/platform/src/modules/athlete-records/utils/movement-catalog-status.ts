import {
  CATALOG_STATUS_ERROR,
  CATALOG_STATUS_LOADING,
  CATALOG_STATUS_READY,
} from "./athlete-records.constants";

export type MovementCatalogStatus =
  | typeof CATALOG_STATUS_LOADING
  | typeof CATALOG_STATUS_ERROR
  | typeof CATALOG_STATUS_READY;

export const toMovementCatalogStatus = (
  isLoading: boolean,
  error: Error | null,
): MovementCatalogStatus => {
  if (error !== null) {
    return CATALOG_STATUS_ERROR;
  }

  if (isLoading) {
    return CATALOG_STATUS_LOADING;
  }

  return CATALOG_STATUS_READY;
};
