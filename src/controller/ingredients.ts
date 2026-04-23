import { Request, Response } from "express";
import { db } from "../config/db";
import { ingredients, restock, productRecipes } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// --- CRUD: READ ---
export const getIngredients = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(ingredients).all();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

// --- CRUD: CREATE ---
export const createIngredient = async (req: Request, res: Response) => {
  try {
    const { name, unit, buyingPrice } = req.body;

    // Log this to your terminal so you can see the "magic" happen
    console.log(`Creating ${name}: Received price ${buyingPrice} (Type: ${typeof buyingPrice})`);

    const [newItem] = await db.insert(ingredients).values({
      name: name,
      unit: unit,
      // This is the "Shield" that protects Turso from strings
      buyingPrice: Number(buyingPrice) || 0, 
      currentQty: 0
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error("DB Insert Error:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
};

// --- CRUD: UPDATE ---
export const updateIngredient = async (req: Request, res: Response) => {
  try {
    await db.update(ingredients)
      .set(req.body)
      .where(eq(ingredients.id, Number(req.params.id)));
    res.json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

export const deleteIngredient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const ingredientId = Number(id);

  try {
    await db.transaction(async (tx) => {
      // 1. Clear Restock History
      await tx.delete(restock).where(eq(restock.ingredientId, ingredientId));
      
      // 2. Clear Recipe Links (Very important!)
      // Note: check your schema if it's called 'recipe' or 'productRecipe'
      await tx.delete(productRecipes).where(eq(productRecipes.ingredientId, ingredientId));

      // 3. Finally, delete the actual Ingredient definition
      await tx.delete(ingredients).where(eq(ingredients.id, ingredientId));
    });

    res.json({ message: "Ingredient and all related data wiped successfully." });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ 
      error: "Could not delete. The ingredient is still linked to other data.", 
      details: error 
    });
  }
};