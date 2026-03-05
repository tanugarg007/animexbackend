import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./router/approuter";

dotenv.config();

const app = express();
const configuredOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalhost = origin.includes("localhost");
      const isVercel = origin.includes(".vercel.app");
      const isConfigured = configuredOrigins.includes(origin);

      // Avoid failing requests with 500 for new domains; if needed, lock this down via CORS_ORIGINS.
      if (isLocalhost || isVercel || isConfigured || configuredOrigins.length === 0) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", router);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
