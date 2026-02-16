type RootKey = readonly string[];

export const createEntityKeys = (root: RootKey, entity: string) => ({
  page: () => [...root, entity, "page-data"] as const,
  byId: (id: string) => [...root, entity, id] as const,
});
