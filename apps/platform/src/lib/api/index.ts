import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  athleteProfile: endpoints.createAthleteProfileAPI(client),
  benchmarkDefinitions: endpoints.createBenchmarkDefinitionsAPI(client),
  calendar: endpoints.createCalendarAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachNotes: endpoints.createCoachNotesAPI(client),
  coachProfile: endpoints.createCoachProfileAPI(client),
  planEnrollments: endpoints.createPlanEnrollmentsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  userBenchmarks: endpoints.createUserBenchmarksAPI(client),
  users: endpoints.createUsersAPI(client),
  workouts: endpoints.createWorkoutsAPI(client),
});

export const api = createApi(browserApiClient);
