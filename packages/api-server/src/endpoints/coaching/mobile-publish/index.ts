import "../../../instrumentation/ensure-di";

import { defaultLegacyMobileClient } from "../../../infrastructure/legacy-mobile";

import { createMobilePublishApi, type MobilePublishApi } from "./create-mobile-publish-api";

export { createMobilePublishApi } from "./create-mobile-publish-api";
export type { MobilePublishApi } from "./create-mobile-publish-api";

export const mobilePublishApi: MobilePublishApi = createMobilePublishApi(defaultLegacyMobileClient);
