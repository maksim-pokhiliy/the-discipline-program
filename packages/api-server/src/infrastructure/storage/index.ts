import { createVercelBlobAdapter } from "./vercel-blob-adapter";

export type { StoragePort, StoragePutOptions, StoragePutResult } from "./port";
export { createVercelBlobAdapter } from "./vercel-blob-adapter";

export const defaultStorage = createVercelBlobAdapter();
