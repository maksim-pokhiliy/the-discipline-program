import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  athleteMaxes: endpoints.createAthleteMaxesAPI(client),
  calendar: endpoints.createCalendarAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachNotes: endpoints.createCoachNotesAPI(client),
  coachProfile: endpoints.createCoachProfileAPI(client),
  exercises: endpoints.createExercisesAPI(client),
  exerciseCategories: endpoints.createExerciseCategoriesAPI(client),
  planEnrollments: endpoints.createPlanEnrollmentsAPI(client),
  prescribedSets: endpoints.createPrescribedSetsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  workoutBlocks: endpoints.createWorkoutBlocksAPI(client),
  workouts: endpoints.createWorkoutsAPI(client),
});

export const api = createApi(browserApiClient);
