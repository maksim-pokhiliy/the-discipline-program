import { type CatalogsApi, createCatalogsApi } from "./catalogs";
import { type ChangePasswordApi, createChangePasswordApi } from "./change-password";
import { createGetUserApi, type GetUserApi } from "./get-user";
import { createSigninApi, type SigninApi } from "./signin";
import { createUpdateUserApi, type UpdateUserApi } from "./update-user";

export type MobileCompatApi = SigninApi &
  CatalogsApi &
  GetUserApi &
  UpdateUserApi &
  ChangePasswordApi;

export const createMobileCompatApi = (): MobileCompatApi => ({
  ...createSigninApi(),
  ...createCatalogsApi(),
  ...createGetUserApi(),
  ...createUpdateUserApi(),
  ...createChangePasswordApi(),
});
