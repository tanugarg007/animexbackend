import { Request, Response } from "express";
import { prisma } from "../prismacontro"; // your prisma client
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ------------------------------
// Login / First Admin Creation
// ------------------------------
export const LoginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log("Login request body:", req.body);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ------------------------------
    // Check total users
    // ------------------------------
    let totalUsers: number;
    try {
      totalUsers = await prisma.user.count();
      console.log("Total users in DB:", totalUsers);
    } catch (err) {
      console.error("Prisma count failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // ------------------------------
    // Check if user exists
    // ------------------------------
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      console.log("Existing user:", existingUser);
    } catch (err) {
      console.error("Prisma findUnique failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // ------------------------------
    // First ever login: create admin
    // ------------------------------
    if (totalUsers === 0 && !existingUser) {
      let hashedPassword: string;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed for first admin");
      } catch (err) {
        console.error("Password hashing failed:", err);
        return res.status(500).json({ message: "Password hashing error" });
      }

      let admin;
      try {
        admin = await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: "ADMIN",
          },
        });
        console.log("First admin created:", admin);
      } catch (err) {
        console.error("Prisma create admin failed:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );
      console.log("JWT created for first admin");

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: admin.id,
          name: admin.name || "Admin",
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar || null,
        },
        admin: {
          id: admin.id,
          name: admin.name || "Admin",
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar || null,
        },
      });
    }

    // ------------------------------
    // Normal login
    // ------------------------------
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let isMatch: boolean;
    try {
      isMatch = await bcrypt.compare(password, existingUser.password);
      console.log("Password comparison result:", isMatch);
    } catch (err) {
      console.error("Password compare failed:", err);
      return res.status(500).json({ message: "Password comparison error" });
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );
    console.log("JWT created for user:", existingUser.id);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: existingUser.id,
        name: existingUser.name || "User",
        email: existingUser.email,
        role: existingUser.role,
        avatar: existingUser.avatar || null,
      },
      admin: {
        id: existingUser.id,
        name: existingUser.name || "User",
        email: existingUser.email,
        role: existingUser.role,
        avatar: existingUser.avatar || null,
      },
    });
  } catch (error: any) {
    console.error("Unexpected login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// Forgot / Reset Admin Password
// ------------------------------
export const ForgotAdminPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, newPassword } = req.body as {
      email?: string;
      newPassword?: string;
    };
    console.log("Forgot password request body:", req.body);

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      console.log("User found for password reset:", user);
    } catch (err) {
      console.error("Prisma findUnique failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 10);
      console.log("New password hashed");
    } catch (err) {
      console.error("Password hashing failed:", err);
      return res.status(500).json({ message: "Password hashing error" });
    }

    try {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { password: hashedPassword },
      });
      console.log("Password updated in DB");
    } catch (err) {
      console.error("Prisma update failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.status(200).json({
      message: "Password reset successful. Please login with new password.",
    });
  } catch (error: any) {
    console.error("Unexpected forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};