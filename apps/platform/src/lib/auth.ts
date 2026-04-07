import { createAuthWrappers } from "@repo/api-routes/auth";
import { authService } from "@repo/api-server";
import { createAuthOptions } from "@repo/auth/config";


export const authOptions = createAuthOptions(authService);

export const { withPlatformAuth } = createAuthWrappers(authOptions);
