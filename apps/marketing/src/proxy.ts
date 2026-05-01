import { type NextRequest } from "next/server";

import { createCspResponse } from "@repo/api-routes";

export const proxy = (req: NextRequest) =>
  createCspResponse(req, { imgSrcExtraHosts: ["images.unsplash.com"] });

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|public|icons).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
