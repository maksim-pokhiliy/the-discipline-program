import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  blocks: endpoints.createBlocksAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  dayMetadata: endpoints.createDayMetadataAPI(client),
  labels: endpoints.createLabelsAPI(client),
  sessions: endpoints.createSessionsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  weeks: endpoints.createWeeksAPI(client),
});

export const api = createApi(browserApiClient);
