import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { baseEnv } from "@repo/env/base";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path") ?? "/";

  if (!baseEnv.REVALIDATE_SECRET || secret !== baseEnv.REVALIDATE_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path });
};
