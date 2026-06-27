import { type ApiClient } from "@repo/api-client";
import type {
  ConnectMobileData,
  GetMobileAthletesResponse,
  GetTrainingLevelsResponse,
  MobileConnection,
} from "@repo/contracts/coaching/mobile-connection";
import type { CreateMobileLinkRequest, MobileLink } from "@repo/contracts/coaching/mobile-link";
import type {
  PublishMobileData,
  PublishMobileResult,
} from "@repo/contracts/coaching/mobile-publish";

export const createMobileAPI = (client: ApiClient) => ({
  connect: (data: ConnectMobileData): Promise<MobileConnection> =>
    client.request("/api/platform/mobile/connections", "POST", data),

  listConnections: (): Promise<MobileConnection[]> =>
    client.request("/api/platform/mobile/connections"),

  listTrainingLevels: (): Promise<GetTrainingLevelsResponse> =>
    client.request("/api/platform/mobile/training-levels"),

  listAthletes: (): Promise<GetMobileAthletesResponse> =>
    client.request("/api/platform/mobile/athletes"),

  createLink: (data: CreateMobileLinkRequest): Promise<MobileLink> =>
    client.request("/api/platform/mobile/links", "POST", data),

  listLinks: (planId: string): Promise<MobileLink[]> =>
    client.request("/api/platform/mobile/links", "GET", undefined, { planId }),

  deleteLink: (linkId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/mobile/links/${linkId}`, "DELETE"),

  publish: (data: PublishMobileData): Promise<PublishMobileResult> =>
    client.request("/api/platform/mobile/publish", "POST", data),
});
