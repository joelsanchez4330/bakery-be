import { Request, Response } from "express";
import { db } from "../config/db";
import { products } from "../db/schema";
import { eq, desc } from "drizzle-orm";

// 1. CREATE PRODUCT (Simple Master Data)
// Use this for the initial "Add Product" form
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, sellingPrice } = req.body;
    
    const [newProd] = await db.insert(products).values({
      name,
      sellingPrice,
    }).returning();

    res.status(201).json(newProd);
  } catch (error) {
    res.status(500).json({ message: "Error creating product master", error });
  }
};

// 2. GET ALL PRODUCTS
// Lists everything for your product table view
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(products).orderBy(desc(products.id));
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
};

// 3. GET SINGLE PRODUCT
// Useful for the "Recipe Management" page header
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [product] = await db.select()
      .from(products)
      .where(eq(products.id, Number(id)));
    
    if (!product) return res.status(404).json({ message: "Product not found" });
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// 4. UPDATE PRODUCT (Basic Info)
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, sellingPrice } = req.body;
  try {
    await db.update(products)
      .set({ name, sellingPrice })
      .where(eq(products.id, Number(id)));
      
    res.status(200).json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};

// 5. DELETE PRODUCT
// This will trigger the ON DELETE CASCADE for recipes and ops
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await db.delete(products).where(eq(products.id, Number(id)));
    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error });
  }
};