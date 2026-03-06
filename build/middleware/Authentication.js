"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Authentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
            return res.status(403).json({ message: "Invalid token payload" });
        }
        const payload = decoded;
        const userId = Number(payload.id);
        if (!Number.isFinite(userId)) {
            return res.status(403).json({ message: "Invalid token payload" });
        }
        req.user = payload.email ? { id: userId, email: payload.email } : { id: userId };
        next();
    });
};
exports.Authentication = Authentication;
