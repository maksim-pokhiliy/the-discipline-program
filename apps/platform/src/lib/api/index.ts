import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  libraryBlockTypes: endpoints.createLibraryBlockTypesAPI(client),
  libraryExercises: endpoints.createLibraryExercisesAPI(client),
  librarySchemes: endpoints.createLibrarySchemesAPI(client),
  planEnrollments: endpoints.createPlanEnrollmentsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  workouts: endpoints.createWorkoutsAPI(client),
});

export const api = createApi(browserApiClient);
