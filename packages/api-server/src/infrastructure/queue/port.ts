export type EnqueueOptions = {
  delayMs?: number;
};

export type EnqueueResult = {
  jobId: string;
};

export type QueuePort = {
  enqueue<T>(jobName: string, payload: T, options?: EnqueueOptions): Promise<EnqueueResult>;
};
