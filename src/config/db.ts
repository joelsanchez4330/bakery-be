import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as schema from "../db/schema";

// Load environment variables from .env
dotenv.config();

const url = process.env.TURSO_CONNECTION_URL;

if (!url) {
  throw new Error("TURSO_CONNECTION_URL is missing in .env");
}

// 1. Establish the connection to Turso
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// 2. Initialize Drizzle with the LibSQL client
export const db = drizzle(client, { schema });