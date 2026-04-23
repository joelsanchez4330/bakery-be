import { Request, Response } from "express";
import { db } from "../config/db";
import { transactions, transactionItems, ingredients, productRecipes } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// 1. CREATE TRANSACTION (Point #7)
export const createTransaction = async (req: Request, res: Response) => {
  const { gmv, paymentMethod, items, statusPayment } = req.body;

  /* items structure: 
    [
      { productId: 1, qty: 2, priceItems: 15000 },
      { productId: 5, qty: 1, priceItems: 25000 }
    ] 
  */

  try {
    const result = await db.transaction(async (tx) => {
      // STEP A: Insert the Transaction Header
      const [newTx] = await tx.insert(transactions).values({
        gmv,
        paymentMethod,
        statusPayment: statusPayment || "PENDING",
      }).returning();

      // STEP B: Insert All Items in the Transaction
      const itemsData = items.map((item: any) => ({
        transactionId: newTx.id,
        productId: item.productId,
        qty: item.qty,
        priceItems: item.priceItems,
      }));
      await tx.insert(transactionItems).values(itemsData);

      // STEP C: TRIGGER STOCK SUBTRACTION (If Status is DONE)
      if (statusPayment === "DONE") {
        for (const item of items) {
          // 1. Find the recipe (ingredients) for this specific product
          const recipe = await tx.select()
            .from(productRecipes)
            .where(eq(productRecipes.productId, item.productId));

          // 2. Loop through every ingredient in that recipe
          for (const ingredient of recipe) {
            // 3. Subtract: current_qty - (qty_used_per_product * how_many_bought)
            await tx.update(ingredients)
              .set({
                currentQty: sql`${ingredients.currentQty} - (${ingredient.qtyUsed} * ${item.qty})`
              })
              .where(eq(ingredients.id, ingredient.ingredientId!));
          }
        }
      }

      return newTx;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ message: "Transaction failed", error });
  }
};

// 2. GET ALL TRANSACTIONS
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const data = await db.query.transactions.findMany({
      with: {
        items: {
          with: {
            product: true // This lets you see the product names in history if needed!
          }
        },
      },
      orderBy: (transactions, { desc }) => [desc(transactions.id)],
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("Drizzle Query Error:", error); // Look at backend console!
    res.status(500).json({ message: "Failed to fetch transactions", error });
  }
};