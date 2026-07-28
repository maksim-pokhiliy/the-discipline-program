import { type ApiClient } from "@repo/api-client";
import type {
  CreateExerciseData,
  Exercise,
  GetAthleteMovementsResponse,
} from "@repo/contracts/lms/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  list: (): Promise<Exercise[]> => client.request("/api/platform/exercises", "GET"),

  listForAthlete: (): Promise<GetAthleteMovementsResponse> =>
    client.request("/api/platform/athlete/movements", "GET"),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    client.request("/api/platform/exercises", "POST", data),
});
