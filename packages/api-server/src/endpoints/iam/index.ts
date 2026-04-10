import { defaultStorage } from "../../infrastructure/storage";

import { createIamUploadAdminApi } from "./upload";

export * from "./auth-service";
export * from "./users-admin";
export * from "./users-search";
export { createIamUploadAdminApi } from "./upload";
export type { IamUploadAdminApi } from "./upload";

export const iamUploadAdminApi = createIamUploadAdminApi(defaultStorage);
