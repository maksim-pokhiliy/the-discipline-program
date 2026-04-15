export const getClientIp = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",").at(0)?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
};
