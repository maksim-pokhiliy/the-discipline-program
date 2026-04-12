import { NextResponse } from "next/server";

type CheckDatabase = () => Promise<void>;

export const createHealthHandler = () => {
  return async () => {
    return NextResponse.json({ status: "ok" });
  };
};

export const createReadyHandler = (checkDatabase: CheckDatabase) => {
  return async () => {
    try {
      await checkDatabase();

      return NextResponse.json({ status: "ready" });
    } catch {
      return NextResponse.json({ status: "not_ready" }, { status: 503 });
    }
  };
};

export const createVersionHandler = () => {
  return async () => {
    return NextResponse.json({
      sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      environment: process.env.NODE_ENV ?? "unknown",
    });
  };
};
