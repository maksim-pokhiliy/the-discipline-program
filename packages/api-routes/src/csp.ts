import { type NextRequest, NextResponse } from "next/server";

export type CspOptions = {
  imgSrcExtraHosts?: string[];
};

const buildCspHeader = (nonce: string, isDev: boolean, options: CspOptions = {}): string => {
  const imgSources = ["'self'", "blob:", "data:", "*.public.blob.vercel-storage.com"];

  if (options.imgSrcExtraHosts?.length) {
    imgSources.push(...options.imgSrcExtraHosts);
  }

  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", isDev ? "'unsafe-eval'" : ""]
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
  request: NextRequest,
  response: NextResponse,
  options: CspOptions = {},
): NextResponse => {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const cspValue = buildCspHeader(nonce, isDev, options);

  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", cspValue);
  response.headers.set("Content-Security-Policy", cspValue);

  return response;
};

export const createCspResponse = (request: NextRequest, options: CspOptions = {}): NextResponse => {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const cspValue = buildCspHeader(nonce, isDev, options);

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", cspValue);

  return response;
};
