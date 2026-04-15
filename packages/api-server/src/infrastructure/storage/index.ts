import { createVercelBlobAdapter } from "./vercel-blob-adapter";

export type { StoragePort, StoragePutOptions, StoragePutResult } from "./port";
export { checkBlobStorage, createVercelBlobAdapter } from "./vercel-blob-adapter";

export const defaultStorage = createVercelBlobAdapter();
