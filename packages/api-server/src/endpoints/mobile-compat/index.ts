import "../../instrumentation/ensure-di";

import { createMobileCompatApi } from "./create-mobile-compat-api";
import { createMobileCompatRoutes } from "./wire-handlers";

export const mobileCompatApi = createMobileCompatApi();
export const mobileCompatRoutes = createMobileCompatRoutes(mobileCompatApi);

export { resolveMobileShimIdentity } from "./identity-resolver";
export {
  findLegacyCatalogEntry,
  LEGACY_TRAINING_LEVELS,
  LEGACY_USER_PLANS,
  LEGACY_USER_ROLES,
} from "./legacy-catalogs";
export type { LegacyCatalogEntry } from "./legacy-catalogs";
export type { MobileCompatApi } from "./create-mobile-compat-api";
export type { MobileCompatRoutes } from "./wire-handlers";
export type { LegacyJwtDto, LegacySigninRequest } from "./wire-schemas";
