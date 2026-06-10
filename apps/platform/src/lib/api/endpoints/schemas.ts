import { type ApiClient } from "@repo/api-client";
import type {
  CreateParallelSchemasRequest,
  CreateSchemaRequest,
  ReorderSchemasRequest,
  Schema,
  SchemaWithBody,
  UpdateSchemaRequest,
} from "@repo/contracts/lms/schema";

export const createSchemasAPI = (client: ApiClient) => ({
  create: (planId: string, data: CreateSchemaRequest): Promise<Schema> =>
    client.request(`/api/platform/training-plans/${planId}/schemas`, "POST", data),

  createParallel: (planId: string, data: CreateParallelSchemasRequest): Promise<SchemaWithBody> =>
    client.request(`/api/platform/training-plans/${planId}/schemas/parallel`, "POST", data),

  update: (planId: string, schemaId: string, data: UpdateSchemaRequest): Promise<Schema> =>
    client.request(`/api/platform/training-plans/${planId}/schemas/${schemaId}`, "PUT", data),

  delete: (planId: string, schemaId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/schemas/${schemaId}`, "DELETE"),

  reorder: (planId: string, data: ReorderSchemasRequest): Promise<{ schemas: Schema[] }> =>
    client.request(`/api/platform/training-plans/${planId}/schemas/reorder`, "PUT", data),
});
