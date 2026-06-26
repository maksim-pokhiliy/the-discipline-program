import { type LegacyMobileClientPort } from "../../../infrastructure/legacy-mobile";

import { type AthletesApi, createAthletesApi } from "./athletes";
import { type ConnectionsApi, createConnectionsApi } from "./connections";
import { type LinksApi, linksApi } from "./links";
import { createPublishApi, type PublishApi } from "./publish";
import { createTrainingLevelsApi, type TrainingLevelsApi } from "./training-levels";

export type MobilePublishApi = ConnectionsApi &
  TrainingLevelsApi &
  AthletesApi &
  LinksApi &
  PublishApi;

export const createMobilePublishApi = (legacyClient: LegacyMobileClientPort): MobilePublishApi => ({
  ...createConnectionsApi(legacyClient),
  ...createTrainingLevelsApi(legacyClient),
  ...createAthletesApi(legacyClient),
  ...linksApi,
  ...createPublishApi(legacyClient),
});
