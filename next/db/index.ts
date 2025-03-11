import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users } from "./schema/users";
import { apikeys } from "./schema/apikeys";
import { links } from "./schema/links";
import { getRequiredEnv } from "../lib/env";

// Create a neon client
const sql = neon(getRequiredEnv("POSTGRES_URL"));

// Create the drizzle client with the schema
export const db = drizzle(sql, {
  schema: {
    users,
    apikeys,
    links,
  },
});

// Export the type of the database instance
export type DB = typeof db;
