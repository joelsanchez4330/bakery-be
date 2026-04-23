import { db } from "../config/db";
import { users } from "./schema";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function seed() {
  console.log("🌱 Seeding initial admin...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  try {
    await db.insert(users).values({
      username: "wulan",
      password: hashedPassword,
      role: "admin",
    });
    console.log("✅ Admin user created: admin / admin123");
  } catch (error) {
    console.error("❌ Seeding failed (User might already exist):", error);
  }
  
  process.exit(0);
}

seed();