import { Request, Response } from "express";
import { db } from "../config/db";
import { 
  transactions, 
  ingredients, 
  transactionItems, 
  productRecipes, 
  productOps, 
  operational,
  products 
} from "../db/schema";
import { sql, eq, desc } from "drizzle-orm";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await db.transaction(async (tx) => {
      // 1. Total GMV (Revenue)
      const [rev] = await tx.select({ val: sql<number>`SUM(${transactions.gmv})` })
        .from(transactions).where(eq(transactions.statusPayment, "DONE"));

      // 2. Total Order Count
      const [orders] = await tx.select({ val: sql<number>`COUNT(*)` })
        .from(transactions).where(eq(transactions.statusPayment, "DONE"));

      // 3. Average Order Value (AOV)
      const totalRevenue = rev?.val || 0;
      const totalOrders = orders?.val || 0;
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // 4. Low Stock Alert Count (Below 500 units)
      const lowStockList = await tx.select().from(ingredients).where(sql`${ingredients.currentQty} < 500`);

      // 5. Total Inventory Value (Current Capital in Stock)
      const [invValue] = await tx.select({ val: sql<number>`SUM(${ingredients.currentQty} * ${ingredients.buyingPrice})` })
        .from(ingredients);

      // 6 & 7. COGS Calculation (Materials + Operational)
      // This joins sales to recipes and utility costs to find the TRUE cost of goods sold
      const [cogsData] = await tx.select({
        ingredientCost: sql<number>`SUM(${transactionItems.qty} * ${productRecipes.qtyUsed} * ${ingredients.buyingPrice})`,
        operationalCost: sql<number>`SUM(${transactionItems.qty} * ${productOps.usageAmount} * ${operational.price})`
      })
      .from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .innerJoin(productRecipes, eq(transactionItems.productId, productRecipes.productId))
      .innerJoin(ingredients, eq(productRecipes.ingredientId, ingredients.id))
      .innerJoin(productOps, eq(transactionItems.productId, productOps.productId))
      .innerJoin(operational, eq(productOps.operationalId, operational.id))
      .where(eq(transactions.statusPayment, "DONE"));

      const totalIngredientCost = cogsData?.ingredientCost || 0;
      const totalOpCost = cogsData?.operationalCost || 0;

      // 8. Gross Profit (Revenue - total COGS)
      const totalCogs = totalIngredientCost + totalOpCost;
      const grossProfit = totalRevenue - totalCogs;

      // 9. Gross Profit Margin %
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // 10. Top 5 Best Selling Products
      const topProducts = await tx.select({
        name: products.name,
        totalSold: sql<number>`SUM(${transactionItems.qty})`
      })
      .from(transactionItems)
      .innerJoin(products, eq(transactionItems.productId, products.id))
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(eq(transactions.statusPayment, "DONE"))
      .groupBy(products.id)
      .orderBy(desc(sql`SUM(${transactionItems.qty})`))
      .limit(5);

      return {
        revenue: totalRevenue,
        orderCount: totalOrders,
        averageOrderValue: aov,
        lowStockCount: lowStockList.length,
        inventoryValue: invValue?.val || 0,
        ingredientCogs: totalIngredientCost,
        operationalCogs: totalOpCost,
        grossProfit: grossProfit,
        marginPercentage: profitMargin,
        topProducts: topProducts,
        lowStockItems: lowStockList // Useful for a "Needs Attention" table
      };
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to generate dashboard metrics" });
  }
};