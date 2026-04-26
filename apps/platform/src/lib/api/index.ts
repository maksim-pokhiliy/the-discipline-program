import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  library: {
    blockKinds: endpoints.createLibraryBlockKindsAPI(client),
    exercises: endpoints.createLibraryExercisesAPI(client),
    schemeTemplates: endpoints.createLibrarySchemeTemplatesAPI(client),
  },
  planBulkPatch: endpoints.createPlanBulkPatchAPI(client),
  planCoachAssignments: endpoints.createPlanCoachAssignmentsAPI(client),
  planEnrollments: endpoints.createPlanEnrollmentsAPI(client),
  planStructure: endpoints.createPlanStructureAPI(client),
  platformCoaches: endpoints.createPlatformCoachesAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
});

export const api = createApi(browserApiClient);
