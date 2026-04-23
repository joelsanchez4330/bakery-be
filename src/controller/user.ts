import { Request, Response } from "express";
import { db } from "../config/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// 1. REGISTER: Create a new user (with hashed password)
export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      role: "admin"
    }).returning();

    res.status(201).json({ message: "User created", userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

// 2. LOGIN: Verify credentials and return a JWT
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
};

// 3. GET PROFILE: Fetch data for the current user
export const getUserProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    if (!user) return res.status(404).json({ message: "User not found" });

    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};

// 4. UPDATE USER: Change username, password, or role
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    const updateData: any = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    updateData.updatedAt = new Date().toISOString();

    await db.update(users).set(updateData).where(eq(users.id, Number(id)));
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};