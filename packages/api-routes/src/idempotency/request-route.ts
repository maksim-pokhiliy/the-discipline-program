import { getClientIp } from "../rate-limit/ip-utils";

export const buildRoutePath = (request: Request, params: Record<string, string>): string => {
  const url = new URL(request.url);
  const valueToName = new Map<string, string>();

  for (const [name, value] of Object.entries(params)) {
    if (value) {
      valueToName.set(value, name);
    }
  }

  return url.pathname
    .split("/")
    .map((segment) => {
      const name = valueToName.get(segment);

      return name ? `[${name}]` : segment;
    })
    .join("/");
};

export const buildCanonicalRoute = (
  method: string,
  request: Request,
  params: Record<string, string>,
): string => `${method.toUpperCase()} ${buildRoutePath(request, params)}`;

export const buildAuthScope = (userId: string): string => `user:${userId}`;
export const buildPublicScope = (request: Request): string => `ip:${getClientIp(request)}`;
