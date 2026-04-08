import { type ApiClient } from "@repo/api-client";
import type {
  CreateBenchmarkDefinitionRequest,
  CreateBenchmarkDefinitionResponse,
  GetBenchmarkDefinitionsResponse,
  UpdateBenchmarkDefinitionRequest,
  UpdateBenchmarkDefinitionResponse,
} from "@repo/contracts/benchmark-definition";
import type {
  CreateUserBenchmarkRequest,
  CreateUserBenchmarkResponse,
  GetUserBenchmarksResponse,
  UpdateUserBenchmarkRequest,
  UpdateUserBenchmarkResponse,
} from "@repo/contracts/user-benchmark";

export const createBenchmarkDefinitionsAPI = (client: ApiClient) => ({
  getAll: (): Promise<GetBenchmarkDefinitionsResponse> =>
    client.request("/api/platform/benchmark-definitions"),

  create: (data: CreateBenchmarkDefinitionRequest): Promise<CreateBenchmarkDefinitionResponse> =>
    client.request("/api/platform/benchmark-definitions", "POST", data),

  update: (
    id: string,
    data: UpdateBenchmarkDefinitionRequest,
  ): Promise<UpdateBenchmarkDefinitionResponse> =>
    client.request(`/api/platform/benchmark-definitions/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/benchmark-definitions/${id}`, "DELETE"),
});

export const createUserBenchmarksAPI = (client: ApiClient) => ({
  getByUser: (userId: string): Promise<GetUserBenchmarksResponse> =>
    client.request(`/api/platform/users/${userId}/benchmarks`),

  create: (
    userId: string,
    data: CreateUserBenchmarkRequest,
  ): Promise<CreateUserBenchmarkResponse> =>
    client.request(`/api/platform/users/${userId}/benchmarks`, "POST", data),

  update: (
    userId: string,
    benchmarkId: string,
    data: UpdateUserBenchmarkRequest,
  ): Promise<UpdateUserBenchmarkResponse> =>
    client.request(`/api/platform/users/${userId}/benchmarks/${benchmarkId}`, "PUT", data),

  delete: (userId: string, benchmarkId: string): Promise<void> =>
    client.request(`/api/platform/users/${userId}/benchmarks/${benchmarkId}`, "DELETE"),
});
