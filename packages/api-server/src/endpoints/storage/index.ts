import "../../instrumentation/ensure-di";

import { defaultStorage } from "../../infrastructure/storage";

import { createStorageUploadAdminApi } from "./upload";

export { createStorageUploadAdminApi } from "./upload";
export type { StorageUploadAdminApi } from "./upload";

export const storageUploadAdminApi = createStorageUploadAdminApi(defaultStorage);
