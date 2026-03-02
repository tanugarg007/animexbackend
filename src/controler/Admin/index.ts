import { Request, Response } from "express";
import { prisma } from "../prismacontro";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const LoginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check total users to support first-login bootstrap
    const totalUsers = await prisma.user.count();
    const existingAdmin = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // First ever login: create initial admin with provided credentials
    if (totalUsers === 0 && !existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const admin = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: "ADMIN",
        },
      });

      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
        },
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
        },
      });
    }

    // Normal login: user must exist
    if (!existingAdmin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, existingAdmin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: existingAdmin.id, email: existingAdmin.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        avatar: existingAdmin.avatar,
      },
      admin: {
        id: existingAdmin.id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        avatar: existingAdmin.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const ForgotAdminPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, newPassword } = req.body as {
      email?: string;
      newPassword?: string;
    };

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Password reset successful. Please login with new password.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
