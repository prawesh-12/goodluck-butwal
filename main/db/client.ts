import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

// Local Postgres sits behind the HTTP proxy from docker-compose, so development and production
// run the same driver and the same query code. Real Neon needs none of this.
if (process.env.DATABASE_URL?.includes("localtest.me")) {
  neonConfig.fetchEndpoint = "http://localhost:4444/sql";
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

// Neon HTTP driver has no pooling, so a long-lived pool would keep compute awake.
export const db = drizzle(neon(process.env.DATABASE_URL!));
