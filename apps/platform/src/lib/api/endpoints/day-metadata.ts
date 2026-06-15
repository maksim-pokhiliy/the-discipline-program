import { type ApiClient } from "@repo/api-client";
import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CloneDayFromRequest,
  CloneDayResponse,
  DaySlot,
  UpdateDayLabelData,
  UpdateDayNotesData,
} from "@repo/contracts/lms/day";

export const createDayMetadataAPI = (client: ApiClient) => ({
  setLabel: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayLabelData,
  ): Promise<DaySlot> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/label`,
      "PUT",
      data,
    ),

  setNotes: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayNotesData,
  ): Promise<DaySlot> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/notes`,
      "PUT",
      data,
    ),

  cloneFrom: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: CloneDayFromRequest,
  ): Promise<CloneDayResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/clone-from`,
      "POST",
      data,
    ),
});
