import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

interface OrderPayload {
  id: string;
  sortOrder: number;
}

const normalizeOrderPayload = (payload: unknown): OrderPayload | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const rawId = record.id;

  const id =
    typeof rawId === "string" ? rawId.trim() : typeof rawId === "number" ? String(rawId) : "";

  const sortOrderValue =
    typeof record.sortOrder === "number"
      ? record.sortOrder
      : typeof record.sortOrder === "string" && record.sortOrder.trim() !== ""
        ? Number(record.sortOrder)
        : Number.NaN;

  if (!id || Number.isNaN(sortOrderValue)) {
    return null;
  }

  return { id, sortOrder: sortOrderValue };
};

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updates = body
      .map(normalizeOrderPayload)
      .filter((update): update is OrderPayload => Boolean(update));

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    const posts = await adminBlogApi.updatePostsOrder(updates);

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to update blog order:", error);

    return NextResponse.json({ error: "Failed to update blog order" }, { status: 500 });
  }
}
