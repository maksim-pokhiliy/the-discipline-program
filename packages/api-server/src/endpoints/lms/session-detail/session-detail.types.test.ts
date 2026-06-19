import { describe, expectTypeOf, it } from "vitest";

import { type ResolvedLoad as ContractResolvedLoad } from "@repo/contracts/lms/session-detail";

import { type ResolvedLoad as ServerResolvedLoad } from "../athlete-records";

describe("ResolvedLoad contract/server parity", () => {
  it("keeps the contract mirror and the api-server type mutually assignable", () => {
    expectTypeOf<ServerResolvedLoad>().toMatchTypeOf<ContractResolvedLoad>();
    expectTypeOf<ContractResolvedLoad>().toMatchTypeOf<ServerResolvedLoad>();
  });
});
