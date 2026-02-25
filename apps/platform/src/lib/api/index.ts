import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  exercises: endpoints.createExercisesAPI(client),
  exerciseCategories: endpoints.createExerciseCategoriesAPI(client),
  coachProfile: endpoints.createCoachProfileAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachNotes: endpoints.createCoachNotesAPI(client),
  athleteFlags: endpoints.createAthleteFlagsAPI(client),
});

export const api = createApi(browserApiClient);
