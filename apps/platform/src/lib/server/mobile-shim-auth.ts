import { createMobileBearerAuth } from "@repo/api-routes/legacy-shim";
import { resolveMobileShimIdentity } from "@repo/api-server/mobile-compat";

export const withMobileBearerAuth = createMobileBearerAuth(resolveMobileShimIdentity);
