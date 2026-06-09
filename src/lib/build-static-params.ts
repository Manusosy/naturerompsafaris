/**
 * Whether to skip Payload (database) access during `generateStaticParams`.
 *
 * This must be an explicit opt-in flag rather than a generic `CI` check:
 * providers like Vercel set `CI=true` during real production builds where the
 * database IS available, so keying off `CI` would wrongly skip static
 * generation in production. Only environments that genuinely lack a database
 * (e.g. the GitHub Actions verify job) set `SKIP_DB_DURING_BUILD=true`.
 */
export function shouldSkipBuildTimePayload() {
  return process.env.SKIP_DB_DURING_BUILD === "true";
}
