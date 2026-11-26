import { createCmsProductAdminApi } from "@repo/api-server/cms";
import { storageUploadAdminApi } from "@repo/api-server/storage";

export const cmsProductAdminApi = createCmsProductAdminApi({
  deleteImage: storageUploadAdminApi.deleteImage,
});
