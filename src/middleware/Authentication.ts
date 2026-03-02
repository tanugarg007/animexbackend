import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const Authentication: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secretkey", (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    if (!decoded || typeof decoded !== "object" || !("id" in decoded)) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    const payload = decoded as JwtPayload & { id: number | string; email?: string };
    const userId = Number(payload.id);
    if (!Number.isFinite(userId)) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.user = payload.email ? { id: userId, email: payload.email } : { id: userId };
    next();
  });
};
