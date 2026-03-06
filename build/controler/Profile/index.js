"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfile = exports.GetProfile = void 0;
const prismacontro_1 = require("../prismacontro");
const GetProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const user = await prismacontro_1.prisma.user.findUnique({
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
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json({
            profile: user,
            message: "Profile fetched successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.GetProfile = GetProfile;
const UpdateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { name, email, removeAvatar } = req.body;
        const uploadedFile = req.file;
        const uploadedAvatar = uploadedFile
            ? `/uploads/${uploadedFile.filename}`
            : undefined;
        const data = {};
        if (name)
            data.name = name;
        if (email)
            data.email = email;
        if (uploadedAvatar) {
            data.avatar = uploadedAvatar;
        }
        if (removeAvatar === "true") {
            data.avatar = null;
        }
        const updatedUser = await prismacontro_1.prisma.user.update({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.UpdateProfile = UpdateProfile;
