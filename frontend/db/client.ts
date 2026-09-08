import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Neon HTTP driver has no pooling, so a long-lived pool would keep compute awake.
export const db = drizzle(neon(process.env.DATABASE_URL!));
