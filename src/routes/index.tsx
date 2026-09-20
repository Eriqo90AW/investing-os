import { Navigate } from "@solidjs/router";

/**
 * The spec page lives at `/design`. Nothing else is served from this app, so
 * the root redirects there rather than 404ing — delete this file the moment a
 * real landing page exists.
 */
export default function Index() {
  return <Navigate href="/design" />;
}
