"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSiteSettings = exports.GetSiteSettings = void 0;
const prismacontro_1 = require("../prismacontro");
const GetSiteSettings = async (req, res) => {
    try {
        const settings = await prismacontro_1.prisma.siteSettings.findFirst();
        res.status(200).json({ settings });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.GetSiteSettings = GetSiteSettings;
const UpdateSiteSettings = async (req, res) => {
    try {
        const { siteTitle, contactEmail } = req.body;
        if (!siteTitle || !contactEmail) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const existing = await prismacontro_1.prisma.siteSettings.findFirst();
        let updated;
        if (existing) {
            updated = await prismacontro_1.prisma.siteSettings.update({
                where: { id: existing.id },
                data: { siteTitle, contactEmail },
            });
        }
        else {
            updated = await prismacontro_1.prisma.siteSettings.create({
                data: { siteTitle, contactEmail },
            });
        }
        res.status(200).json({
            message: "Settings updated successfully",
            settings: updated,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.UpdateSiteSettings = UpdateSiteSettings;
