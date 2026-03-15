import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router } from "./router/approuter.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://dreamanimex.com",
    "https://www.dreamanimex.com"
  ],
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