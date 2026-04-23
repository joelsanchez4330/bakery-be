import { Request, Response } from "express";
import { db } from "../config/db";
import { eq } from "drizzle-orm";
import { restock, operational, productOps } from "../db/schema";

// --- CRUD: READ ---
export const getOperational = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(operational).all();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch operational data" });
  }
};

// --- CRUD: CREATE ---
export const createOperational = async (req: Request, res: Response) => {
  try {
    const [newItem] = await db.insert(operational).values(req.body).returning();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create operational element" });
  }
};

// --- CRUD: UPDATE ---
export const updateOperational = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.update(operational)
      .set(req.body)
      .where(eq(operational.id, Number(id)));
    res.json({ message: "Operational updated" });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

// --- CRUD: DELETE ---
export const deleteOperational = async (req: Request, res: Response) => {
  const { id } = req.params;
  const opId = Number(id);

  try {
    await db.transaction(async (tx) => {
      // 2. Delete links to Products (Check if your table is named 'productOps')
      // This is for when you've added "Gas" to a "Croissant" recipe
      await tx.delete(productOps).where(eq(productOps.operationalId, opId));

      // 1. Delete associated Restock history
      await tx.delete(restock).where(eq(restock.operationalId, opId));


      // 3. Finally, delete the Operational master data
      await tx.delete(operational).where(eq(operational.id, opId));
    });

    res.json({ message: "Operational item and all history deleted successfully" });
  } catch (error) {
    console.error("Operational Delete Error:", error);
    res.status(500).json({ 
      error: "Delete failed. This item is still being used in recipes or history.",
      details: error 
    });
  }
};