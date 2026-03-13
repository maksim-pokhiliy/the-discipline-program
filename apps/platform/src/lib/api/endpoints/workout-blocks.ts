import { type ApiClient } from "@repo/api-client";
import type {
  CreateWorkoutBlockData,
  UpdateWorkoutBlockData,
  WorkoutBlock,
} from "@repo/contracts/workout-block";

export const createWorkoutBlocksAPI = (client: ApiClient) => ({
  getAll: (workoutId: string): Promise<WorkoutBlock[]> =>
    client.request(`/api/platform/workouts/${workoutId}/blocks`),

  getById: (workoutId: string, id: string): Promise<WorkoutBlock> =>
    client.request(`/api/platform/workouts/${workoutId}/blocks/${id}`),

  create: (workoutId: string, data: CreateWorkoutBlockData): Promise<WorkoutBlock> =>
    client.request(`/api/platform/workouts/${workoutId}/blocks`, "POST", data),

  update: (workoutId: string, id: string, data: UpdateWorkoutBlockData): Promise<WorkoutBlock> =>
    client.request(`/api/platform/workouts/${workoutId}/blocks/${id}`, "PUT", data),

  delete: (workoutId: string, id: string): Promise<void> =>
    client.request(`/api/platform/workouts/${workoutId}/blocks/${id}`, "DELETE"),

  reorderSets: (blockId: string, orderedIds: string[]): Promise<void> =>
    client.request(`/api/platform/blocks/${blockId}/reorder-sets`, "PUT", { orderedIds }),
});
