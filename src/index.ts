import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './router/approuter';

dotenv.config();

const app = express();



const corsOptions = {
  origin: "*",
  methods: "*",
  allowedHeaders: ["Content-Type", "Authorization"],

};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', router);
app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
