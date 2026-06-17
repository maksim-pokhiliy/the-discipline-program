import { type ApiClient } from "@repo/api-client";
import type { PlanTimetableResponse } from "@repo/contracts/lms/plan-timetable";

export const createPlanTimetableAPI = (client: ApiClient) => ({
  get: (): Promise<PlanTimetableResponse> => client.request("/api/platform/athlete/plan-timetable"),
});
