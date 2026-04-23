import { Request, Response } from "express";
import { db } from "../config/db";
import { productOps, operational } from "../db/schema";
import { eq } from "drizzle-orm";

// 1. ASSIGN OPERATIONAL TO PRODUCT (Point #5)
export const addOpToProduct = async (req: Request, res: Response) => {
  try {
    const { productId, operationalId, usageAmount } = req.body;
    
    const [newItem] = await db.insert(productOps).values({
      productId,
      operationalId,
      usageAmount
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to link operational element", error });
  }
};

// 2. GET OPS BY PRODUCT ID
// Useful for showing the "Operational Cost" list on the product detail page
export const getOpsByProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const data = await db.select({
      id: productOps.id,
      operationalId: productOps.operationalId,
      opName: operational.name,
      opUnit: operational.unit,
      usageAmount: productOps.usageAmount,
      pricePerUnit: operational.price,
    })
    .from(productOps)
    .innerJoin(operational, eq(productOps.operationalId, operational.id))
    .where(eq(productOps.productId, Number(productId)));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch operational details", error });
  }
};

// 3. REMOVE OP FROM PRODUCT
export const removeOpFromProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(productOps).where(eq(productOps.id, Number(id)));
    res.status(200).json({ message: "Operational element removed" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};

// 4. UPDATE USAGE AMOUNT
export const updateOpUsage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { usageAmount } = req.body;
  try {
    await db.update(productOps)
      .set({ usageAmount })
      .where(eq(productOps.id, Number(id)));
    
    res.status(200).json({ message: "Usage amount updated" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};