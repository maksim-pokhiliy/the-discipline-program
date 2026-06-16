import { type ApiClient } from "@repo/api-client";
import type {
  CreateSchemaRowRequest,
  ReorderSchemaRowsRequest,
  SchemaRow,
  UpdateSchemaRowRequest,
} from "@repo/contracts/lms/schema-row";

export const createSchemaRowsAPI = (client: ApiClient) => ({
  create: (planId: string, data: CreateSchemaRowRequest): Promise<SchemaRow> =>
    client.request(`/api/platform/training-plans/${planId}/schema-rows`, "POST", data),

  update: (planId: string, schemaRowId: string, data: UpdateSchemaRowRequest): Promise<SchemaRow> =>
    client.request(
      `/api/platform/training-plans/${planId}/schema-rows/${schemaRowId}`,
      "PUT",
      data,
    ),

  delete: (planId: string, schemaRowId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/schema-rows/${schemaRowId}`,
      "DELETE",
    ),

  duplicate: (planId: string, schemaRowId: string): Promise<SchemaRow> =>
    client.request(
      `/api/platform/training-plans/${planId}/schema-rows/${schemaRowId}/duplicate`,
      "POST",
      {},
    ),

  reorder: (planId: string, data: ReorderSchemaRowsRequest): Promise<{ schemaRows: SchemaRow[] }> =>
    client.request(`/api/platform/training-plans/${planId}/schema-rows/reorder`, "PUT", data),
});
