import { type ApiClient } from "@repo/api-client";
import {
  type CreateLocaleRequest,
  type GetLocalesResponse,
  type Locale,
  type LocaleCode,
  type ReorderLocalesRequest,
  type ReorderLocalesResponse,
  type UpdateLocaleRequest,
} from "@repo/contracts/cms/locale";

type LocalesAPI = {
  list: () => Promise<GetLocalesResponse>;
  create: (data: CreateLocaleRequest) => Promise<Locale>;
  update: (code: LocaleCode, data: UpdateLocaleRequest) => Promise<void>;
  reorder: (data: ReorderLocalesRequest) => Promise<ReorderLocalesResponse>;
  delete: (code: LocaleCode) => Promise<void>;
};

export const createLocalesAPI = (client: ApiClient): LocalesAPI => ({
  list: () => client.request("/api/admin/locales"),
  create: (data) => client.request("/api/admin/locales", "POST", data),
  update: (code, data) => client.requestNoContent(`/api/admin/locales/${code}`, "PATCH", data),
  reorder: (data) => client.request("/api/admin/locales/reorder", "PUT", data),
  delete: (code) => client.requestNoContent(`/api/admin/locales/${code}`, "DELETE"),
});
