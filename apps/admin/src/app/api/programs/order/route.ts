import { adminProgramsApi } from "@repo/api/server";
import { NextResponse } from "next/server";

type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

function parseUpdates(payload: unknown): SortOrderUpdate[] | null {
  if (Array.isArray(payload)) {
    return payload as SortOrderUpdate[];
  }

  if (payload && typeof payload === "object") {
    const maybe = payload as Record<string, unknown>;
    const arr = (maybe.updates ?? maybe.order ?? maybe.items) as unknown;

    if (Array.isArray(arr)) {
      return arr as SortOrderUpdate[];
    }
  }

  return null;
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updates = parseUpdates(body);

    if (!updates) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const update of updates) {
      if (!update || typeof update.id !== "string" || typeof update.sortOrder !== "number") {
        return NextResponse.json({ error: "Invalid updates" }, { status: 400 });
      }
    }

    await adminProgramsApi.updateProgramsOrder(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update programs order:", error);

    const message = error instanceof Error ? error.message : "Failed to update programs order";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
