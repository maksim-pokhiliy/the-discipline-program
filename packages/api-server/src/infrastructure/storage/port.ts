export type StoragePutOptions = {
  access?: "public";
};

export type StoragePutResult = {
  url: string;
};

export type StoragePort = {
  put(key: string, file: File, options?: StoragePutOptions): Promise<StoragePutResult>;
  delete(url: string): Promise<void>;
};
