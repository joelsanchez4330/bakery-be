import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

// 0. Users Table (For Credentials/Profile)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").unique(), // Optional: if using Clerk, store their external ID here
  username: text("username").notNull().unique(),
  password: text("password"), // Can be null if you rely solely on Clerk for auth
  role: text("role").default("admin"), // e.g., 'admin', 'staff'
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// 1. Ingredients Table
export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unit: text("unit").notNull(), 
  currentQty: real("current_qty").default(0),
  buyingPrice: real("buying_price").default(0),
});

// 2. Operational Table
export const operational = sqliteTable("operational", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  price: real("price").default(0),
});

// 3. Product Table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sellingPrice: real("selling_price").notNull(),
});

// 4. Product Recipes
export const productRecipes = sqliteTable("product_recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  qtyUsed: real("qty_used").notNull(),
});

// 5. Product Operational
export const productOps = sqliteTable("product_ops", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  operationalId: integer("operational_id").references(() => operational.id),
  usageAmount: real("usage_amount").notNull(),
});

// 6. Restock History
export const restock = sqliteTable("restock", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Keep this (make sure it's NOT .notNull() so it can be empty for Ops)
  ingredientId: integer("ingredient_id").references(() => ingredients.id),
  
  // ADD THIS: The new shelf for utility IDs
  operationalId: integer("operational_id").references(() => operational.id),
  
  // ADD THIS: To distinguish between 'INGREDIENT' or 'OPERATIONAL'
  type: text("type").default('INGREDIENT'), 

  qtyBought: real("qty_bought").notNull(),
  totalCost: real("total_cost").notNull(),
  purchaseDate: text("purchase_date").default(sql`CURRENT_TIMESTAMP`),
  userId: integer("user_id").references(() => users.id),
});

// 7. Transaction Log
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gmv: real("gmv").notNull(),
  date: text("date").default(sql`CURRENT_TIMESTAMP`),
  statusPayment: text("status_payment").default("PENDING"),
  paymentMethod: text("payment_method"),
  userId: integer("user_id").references(() => users.id), // Tracks which cashier/admin sold it
});

// 8. Transaction Items
export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  qty: integer("qty").notNull(),
  priceItems: real("price_items").notNull(),
});

// --- RELATIONSHIPS ---

export const usersRelations = relations(users, ({ many }) => ({
  restocks: many(restock),
  transactions: many(transactions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  recipes: many(productRecipes),
  ops: many(productOps),
}));

export const productRecipesRelations = relations(productRecipes, ({ one }) => ({
  product: one(products, { fields: [productRecipes.productId], references: [products.id] }),
  ingredient: one(ingredients, { fields: [productRecipes.ingredientId], references: [ingredients.id] }),
}));

export const productOpsRelations = relations(productOps, ({ one }) => ({
  product: one(products, { fields: [productOps.productId], references: [products.id] }),
  operational: one(operational, { fields: [productOps.operationalId], references: [operational.id] }),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipes: many(productRecipes),
  restocks: many(restock),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  items: many(transactionItems),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  product: one(products, {
    fields: [transactionItems.productId],
    references: [products.id],
  }),
}));