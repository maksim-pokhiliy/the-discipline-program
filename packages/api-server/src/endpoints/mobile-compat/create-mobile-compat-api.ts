import { type CatalogsApi, createCatalogsApi } from "./catalogs";
import { createSigninApi, type SigninApi } from "./signin";

export type MobileCompatApi = SigninApi & CatalogsApi;

export const createMobileCompatApi = (): MobileCompatApi => ({
  ...createSigninApi(),
  ...createCatalogsApi(),
});
