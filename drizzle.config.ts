import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso", // Correct for current Drizzle Kit versions
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL!, // Ensure this matches your .env key
    authToken: process.env.TURSO_AUTH_TOKEN!, 
  },
});