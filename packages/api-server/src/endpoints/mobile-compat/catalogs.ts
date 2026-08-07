import {
  LEGACY_TRAINING_LEVELS,
  LEGACY_USER_PLANS,
  type LegacyCatalogEntry,
} from "./legacy-catalogs";

export type CatalogsApi = {
  listTrainingLevels: () => readonly LegacyCatalogEntry[];
  listUserPlans: () => readonly LegacyCatalogEntry[];
};

export const createCatalogsApi = (): CatalogsApi => ({
  listTrainingLevels: () => LEGACY_TRAINING_LEVELS,
  listUserPlans: () => LEGACY_USER_PLANS,
});
