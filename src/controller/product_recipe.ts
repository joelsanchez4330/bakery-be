import { Request, Response } from "express";
import { db } from "../config/db";
import { productRecipes, ingredients } from "../db/schema";
import { eq, and } from "drizzle-orm";

// 1. ADD INGREDIENT TO PRODUCT (Point #4)
// Use this when the user clicks "Add" on the Recipe Manage page
export const addIngredientToRecipe = async (req: Request, res: Response) => {
  try {
    const { productId, ingredientId, qtyUsed } = req.body;
    
    const [newItem] = await db.insert(productRecipes).values({
      productId,
      ingredientId,
      qtyUsed
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to link ingredient", error });
  }
};

// 2. GET RECIPE BY PRODUCT ID
// Pulls all ingredients for a specific product, including ingredient names
export const getRecipeByProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;
  try {
    const data = await db.select({
      id: productRecipes.id,
      ingredientId: productRecipes.ingredientId,
      ingredientName: ingredients.name,
      ingredientUnit: ingredients.unit,
      qtyUsed: productRecipes.qtyUsed,
    })
    .from(productRecipes)
    .innerJoin(ingredients, eq(productRecipes.ingredientId, ingredients.id))
    .where(eq(productRecipes.productId, Number(productId)));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recipe", error });
  }
};

// 3. REMOVE INGREDIENT FROM RECIPE
// Use this for the "Delete" button on the recipe list
export const removeIngredientFromRecipe = async (req: Request, res: Response) => {
  const { id } = req.params; // The ID of the recipe row, not the product
  try {
    await db.delete(productRecipes).where(eq(productRecipes.id, Number(id)));
    res.status(200).json({ message: "Ingredient removed from recipe" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove ingredient", error });
  }
};

// 4. UPDATE QTY IN RECIPE
// If the user wants to change 180g to 200g without deleting the row
export const updateRecipeQty = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { qtyUsed } = req.body;
  try {
    await db.update(productRecipes)
      .set({ qtyUsed })
      .where(eq(productRecipes.id, Number(id)));
    
    res.status(200).json({ message: "Recipe quantity updated" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};