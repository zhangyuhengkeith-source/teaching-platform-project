export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/classes",
  "/electives",
  "/service",
  "/notifications",
  "/profile",
  "/wrong-book",
  "/admin",
  "/waiting-assignment",
] as const;

export const PROTECTED_ROUTE_MATCHER = PROTECTED_PREFIXES.map((prefix) => `${prefix}/:path*`);
