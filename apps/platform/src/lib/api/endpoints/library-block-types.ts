import { type ApiClient } from "@repo/api-client";
import type { BlockType } from "@repo/contracts/library/block-type";

export const createLibraryBlockTypesAPI = (client: ApiClient) => ({
  list: (): Promise<BlockType[]> => client.request("/api/platform/library/block-types"),
});
