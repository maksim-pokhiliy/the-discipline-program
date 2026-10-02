import { type GetTrainingLevelsResponse } from "@repo/contracts/coaching/mobile-connection";

import { LEGACY_TRAINING_LEVELS } from "../../mobile-compat/legacy-catalogs";

export type TrainingLevelsApi = {
  listTrainingLevels(userId: string): Promise<GetTrainingLevelsResponse>;
};

export const trainingLevelsApi: TrainingLevelsApi = {
  listTrainingLevels: async () => LEGACY_TRAINING_LEVELS.map(({ id, name }) => ({ id, name })),
};
