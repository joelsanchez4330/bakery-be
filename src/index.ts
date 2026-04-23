import express, { Application } from "express";
import cors from "cors";
import "dotenv/config"; // This loads .env directly at the top level
import mainRouter from "./router/router";

const app: Application = express();

// Use process.env directly for the port
const PORT = process.env.PORT || 5000;

// --- 1. CONFIGURE CORS ---
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://ohmydesert.solomon-analytics.store" // ADD YOUR LIVE VERCEL URL HERE
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`✅ SERVER RUNNING ON PORT: ${PORT}`);
});