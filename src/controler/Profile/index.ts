import { Request, Response } from "express";
import { prisma } from "../prismacontro";

export const GetProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      profile: user,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const UpdateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, email, avatar } = req.body as {
      name?: string;
      email?: string;
      avatar?: string;
    };

    const files = (req.files as Express.Multer.File[] | undefined) || [];
    const fileFromSingle = req.file as Express.Multer.File | undefined;
    const uploadedFile = fileFromSingle || files[0];
    const uploadedAvatar = uploadedFile ? `/uploads/${uploadedFile.filename}` : undefined;

    const data: { name?: string; email?: string; avatar?: string } = {};
    if (name) data.name = name;
    if (email) data.email = email;
    const finalAvatar = uploadedAvatar ?? avatar;
    if (finalAvatar) data.avatar = finalAvatar;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      profile: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
