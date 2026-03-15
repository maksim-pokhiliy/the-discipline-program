import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  calendar: endpoints.createCalendarAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachNotes: endpoints.createCoachNotesAPI(client),
  coachProfile: endpoints.createCoachProfileAPI(client),
  planEnrollments: endpoints.createPlanEnrollmentsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  workouts: endpoints.createWorkoutsAPI(client),
});

export const api = createApi(browserApiClient);
