import { type NextRequest, NextResponse } from "next/server";

export type CspOptions = {
  imgSrcExtraHosts?: string[];
};

const buildCspHeader = (isDev: boolean, options: CspOptions = {}): string => {
  const imgSources = ["'self'", "blob:", "data:", "*.public.blob.vercel-storage.com"];

  if (options.imgSrcExtraHosts?.length) {
    imgSources.push(...options.imgSrcExtraHosts);
  }

  const scriptSrc = ["'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : ""]
    .filter(Boolean)
    .join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(" ")}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
};

export const generateNonce = (): string => Buffer.from(crypto.randomUUID()).toString("base64");

export const applyCspHeaders = (
  _request: NextRequest,
  response: NextResponse,
  options: CspOptions = {},
): NextResponse => {
  const isDev = process.env.NODE_ENV === "development";
  const cspValue = buildCspHeader(isDev, options);

  response.headers.set("Content-Security-Policy", cspValue);

  return response;
};

export const createCspResponse = (
  _request: NextRequest,
  options: CspOptions = {},
): NextResponse => {
  const isDev = process.env.NODE_ENV === "development";
  const cspValue = buildCspHeader(isDev, options);

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", cspValue);

  return response;
};
