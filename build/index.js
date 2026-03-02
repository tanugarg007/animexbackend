"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const approuter_1 = require("./router/approuter");
dotenv_1.default.config();
const app = (0, express_1.default)();
const corsOptions = {
    origin: '*',
    methods: '*',
    allowedHeaders: 'Content-Type,Authorization',
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/users', approuter_1.router);
app.use("/uploads", express_1.default.static("uploads"));
app.get('/', (req, res) => {
    res.send('Backend is running!');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
