import {
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
};
