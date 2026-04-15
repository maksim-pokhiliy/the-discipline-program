import { idParamSchema } from "../../../common";

import { adminUserViewSchema } from "./admin-user-view.schema";

export const getAdminUserViewParamsSchema = idParamSchema;

export const getAdminUserViewResponseSchema = adminUserViewSchema;
