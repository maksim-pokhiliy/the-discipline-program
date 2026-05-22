import { type ApiClient } from "@repo/api-client";
import type { Archetype } from "@repo/contracts/lms/archetype";

export const createArchetypesAPI = (client: ApiClient) => ({
  list: (): Promise<Archetype[]> => client.request("/api/platform/archetypes", "GET"),
});
