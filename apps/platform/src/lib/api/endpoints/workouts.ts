import { type ApiClient } from "@repo/api-client";
import type { CreateWorkoutData, UpdateWorkoutData, Workout } from "@repo/contracts/lms/workout";

export const createWorkoutsAPI = (client: ApiClient) => ({
  getAll: (planId: string): Promise<Workout[]> =>
    client.request(`/api/platform/training-plans/${planId}/workouts`),

  create: (planId: string, data: CreateWorkoutData): Promise<Workout> =>
    client.request(`/api/platform/training-plans/${planId}/workouts`, "POST", data),

  update: (planId: string, id: string, data: UpdateWorkoutData): Promise<Workout> =>
    client.request(`/api/platform/training-plans/${planId}/workouts/${id}`, "PUT", data),

  delete: (planId: string, id: string): Promise<void> =>
    client.request(`/api/platform/training-plans/${planId}/workouts/${id}`, "DELETE"),

  move: (
    workoutId: string,
    scheduledDate: Date,
    targetDayOrderedIds?: string[],
  ): Promise<Workout> =>
    client.request(`/api/platform/workouts/${workoutId}/move`, "PUT", {
      scheduledDate,
      targetDayOrderedIds,
    }),

  reorder: (planId: string, orderedIds: string[]): Promise<void> =>
    client.request(`/api/platform/training-plans/${planId}/reorder-workouts`, "PUT", {
      orderedIds,
    }),

  copyWeek: (planId: string, sourceDate: Date, targetDate: Date): Promise<Workout[]> =>
    client.request(`/api/platform/training-plans/${planId}/copy-week`, "POST", {
      sourceDate,
      targetDate,
    }),
});
