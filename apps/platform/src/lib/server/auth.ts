import { createAuthWrappers } from "@repo/api-routes/auth";
import { iamAuthService } from "@repo/api-server/iam";
import { createAuthOptions } from "@repo/auth/config";

export const authOptions = createAuthOptions(iamAuthService);

export const { withPlatformAuth, withCoachAuth } = createAuthWrappers(authOptions);
