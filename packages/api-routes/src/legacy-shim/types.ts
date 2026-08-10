import type { RouteContext } from "../types";

export type LegacyShimIdentity = {
  userId: string;
  legacyUserId: number;
  legacyRoleId: number;
  legacyPlanId: number;
  legacyLevelId: number;
};

export type LegacyShimResolution =
  | { kind: "authenticated"; identity: LegacyShimIdentity }
  | { kind: "denied" };

export type LegacyShimResolver = (token: string) => Promise<LegacyShimResolution>;

export type LegacyShimHandler = (
  request: Request,
  context: RouteContext,
  identity: LegacyShimIdentity,
) => Promise<Response>;

export type LegacyShimOutcome<TPayload> = { kind: "ok"; payload: TPayload } | { kind: "denied" };

export type LegacyUserOutcome<TPayload> =
  | { kind: "ok-json"; payload: TPayload }
  | { kind: "ok-empty" }
  | { kind: "not-found" }
  | { kind: "unauthorized" }
  | { kind: "bad-request" };
