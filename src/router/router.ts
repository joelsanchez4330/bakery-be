import { Router } from "express";

// Import Controllers
import * as User from "../controller/user";         // Combined User (4 functions)
import * as Ingred from "../controller/ingredients";
import * as Ops from "../controller/operational";
import * as Prod from "../controller/product";
import * as Recipe from "../controller/product_recipe";
import * as ProductOps from "../controller/product_ops";
import * as Restock from "../controller/restock";
import * as Tx from "../controller/transaction";
import { getDashboardStats } from "../controller/dashboard";

// Import Middleware
import { requireAuth } from "../middleware/auth";

const router = Router();

// --- 1. AUTH ROUTES (Public) ---
// These are the only routes accessible without a token
router.post("/register", User.register);
router.post("/login", User.login);

// --- PROTECTED ROUTES (Middleware Gate) ---
router.use(requireAuth); 

// --- 2. DASHBOARD ---
router.get("/dashboard", getDashboardStats);

// --- 3. INVENTORY (Ingredients & Restock) ---
router.get("/ingredients", Ingred.getIngredients);
router.post("/ingredients", Ingred.createIngredient);
router.put("/ingredients/:id", Ingred.updateIngredient);
router.delete("/ingredients/:id", Ingred.deleteIngredient);

router.post("/restock", Restock.createRestock);
router.get("/restock/history", Restock.getRestockHistory);

// --- 4. OPERATIONAL COSTS (Utilities like Gas/Elec) ---
router.get("/operational", Ops.getOperational);
router.post("/operational", Ops.createOperational);
router.put("/operational/:id", Ops.updateOperational);
router.delete("/operational/:id", Ops.deleteOperational);

// --- 5. PRODUCTS (Master Data) ---
router.get("/products", Prod.getAllProducts);
router.post("/products", Prod.createProduct);
router.get("/products/:id", Prod.getProductById);
router.put("/products/:id", Prod.updateProduct);
router.delete("/products/:id", Prod.deleteProduct);

// --- 6. RECIPE & PRODUCT DETAILS (Decoupled Management) ---
// Manage Ingredients linked to Product
router.get("/products/:productId/recipe", Recipe.getRecipeByProduct);
router.post("/recipe", Recipe.addIngredientToRecipe);
router.put("/recipe/:id", Recipe.updateRecipeQty);
router.delete("/recipe/:id", Recipe.removeIngredientFromRecipe);

// Manage Ops linked to Product
router.get("/products/:productId/ops", ProductOps.getOpsByProduct);
router.post("/product-ops", ProductOps.addOpToProduct);
router.put("/product-ops/:id", ProductOps.updateOpUsage);
router.delete("/product-ops/:id", ProductOps.removeOpFromProduct);

// --- 7. TRANSACTIONS (Sales) ---
router.get("/transactions", Tx.getTransactions);
router.post("/transactions", Tx.createTransaction);

// --- 8. USER PROFILE ---
router.get("/users/:id", User.getUserProfile);
router.put("/users/:id", User.updateUser);

export default router;