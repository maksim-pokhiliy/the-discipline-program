export const getClientIp = (request: Request): string => {
  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",").at(-1)?.trim() ?? "unknown";
  }

  return "unknown";
};
