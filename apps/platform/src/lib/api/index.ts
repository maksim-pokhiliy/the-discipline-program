import {
  athleteFlagsAPI,
  coachDashboardAPI,
  coachNotesAPI,
  coachProfileAPI,
  exerciseCategoriesAPI,
  exercisesAPI,
  trainingPlansAPI,
} from "./endpoints";

export const api = {
  trainingPlans: trainingPlansAPI,
  exercises: exercisesAPI,
  exerciseCategories: exerciseCategoriesAPI,
  coachProfile: coachProfileAPI,
  coachDashboard: coachDashboardAPI,
  coachNotes: coachNotesAPI,
  athleteFlags: athleteFlagsAPI,
};
