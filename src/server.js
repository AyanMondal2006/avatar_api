import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import avatarRoutes from "./routes/avatar.routes.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://io-chat-eight.vercel.app"
  ]
}));

app.use(express.json());

// API routes
app.use("/api/avatars", avatarRoutes);

// Health-check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Streamify Avatar API is running!",
  });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
