import express, { Application } from "express";
import cors from "cors";
import "dotenv/config"; // This loads .env directly at the top level
import mainRouter from "./router/router";

const app: Application = express();

// Use process.env directly for the port
const PORT = process.env.PORT || 5000;

// --- 1. CONFIGURE CORS ---
app.use(cors({
  // Allows your React app (Vite) to access the API
  origin: "http://localhost:5173", 
  
  // Explicitly allowing the 4 CRUD methods + OPTIONS (for preflight)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  
  // Necessary for sending the 'Authorization: Bearer <token>' header
  allowedHeaders: ["Content-Type", "Authorization"],
  
  credentials: true
}));

// --- 2. GLOBAL MIDDLEWARE ---

// Parse incoming JSON request bodies
app.use(express.json());

// --- 3. ROUTES ---

// Mount the main router
app.use("/api", mainRouter);

// Basic health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Inventory System API is active" });
});

// --- 4. START SERVER ---

app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`✅ SERVER RUNNING ON PORT: ${PORT}`);
  console.log(`🚀 API BASE: http://localhost:${PORT}/api`);
  console.log(`-----------------------------------------`);
});