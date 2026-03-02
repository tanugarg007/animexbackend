import { Request, Response } from "express";
import { prisma } from "../prismacontro";

export const GetSiteSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findFirst();
    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdateSiteSettings = async (req: Request, res: Response) => {
  try {
    const { siteTitle, contactEmail } = req.body;

    if (!siteTitle || !contactEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await prisma.siteSettings.findFirst();

    let updated;

    if (existing) {
      updated = await prisma.siteSettings.update({
        where: { id: existing.id },
        data: { siteTitle, contactEmail },
      });
    } else {
      updated = await prisma.siteSettings.create({
        data: { siteTitle, contactEmail },
      });
    }

    res.status(200).json({
      message: "Settings updated successfully",
      settings: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};