import { Request, Response } from "express";
import { db } from "../config/db";
import { restock, ingredients, operational } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";

// 1. EXECUTE RESTOCK (Point #6)
// This is the "Transaction" that adds stock to your inventory
export const createRestock = async (req: Request, res: Response) => {
  // 1. Destructure the new fields we added to the payload
  const { type, ingredientId, operationalId, qtyBought, totalCost } = req.body;

  try {
    await db.transaction(async (tx) => {
      
      // A. Add to Restock History table
      // We now include 'type' and 'operationalId'
      await tx.insert(restock).values({
        type, // 'INGREDIENT' or 'OPERATIONAL'
        ingredientId: type === 'INGREDIENT' ? ingredientId : null,
        operationalId: type === 'OPERATIONAL' ? operationalId : null,
        qtyBought,
        totalCost,
      });

      // B. BRANCHING LOGIC
      if (type === 'INGREDIENT' && ingredientId) {
        // Update physical stock and buying price
        await tx.update(ingredients)
          .set({
            currentQty: sql`${ingredients.currentQty} + ${qtyBought}`,
            buyingPrice: totalCost / qtyBought, 
          })
          .where(eq(ingredients.id, ingredientId));
      } 
      
      else if (type === 'OPERATIONAL' && operationalId) {
        // Update the Utility Master Rate in the operational table
        // This ensures your product profit math stays accurate!
        await tx.update(operational)
          .set({
            // Explicitly tell Drizzle: update the 'price' column in the 'operational' table
            price: totalCost / qtyBought, 
          })
        .where(eq(operational.id, operationalId));
      }
    });

    res.status(201).json({ message: "Restock successful" });
  } catch (error) {
    console.error("Restock Error:", error);
    res.status(500).json({ message: "Restock failed", error });
  }
};

// 2. GET RESTOCK HISTORY
export const getRestockHistory = async (req: Request, res: Response) => {
  try {
    const data = await db.select({
      id: restock.id,
      type: restock.type,
      qtyBought: restock.qtyBought,
      totalCost: restock.totalCost,
      date: restock.purchaseDate,
      // We pull names from both tables
      ingredientName: ingredients.name,
      ingredientUnit: ingredients.unit,
      operationalName: operational.name,
      operationalUnit: operational.unit,
    })
    .from(restock)
    // CRITICAL: Use leftJoin, NOT innerJoin
    .leftJoin(ingredients, eq(restock.ingredientId, ingredients.id))
    .leftJoin(operational, eq(restock.operationalId, operational.id))
    .orderBy(desc(restock.id));

    res.status(200).json(data);
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).json({ message: "Failed to fetch history", error });
  }
};