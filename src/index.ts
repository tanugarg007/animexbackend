import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./router/approuter";
dotenv.config();

const app = express();

app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1") ||
      origin.startsWith("https://www.dreamanimex.com") ||
      origin.startsWith("https://dreamanimex.com")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },

  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", router);
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
