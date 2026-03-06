"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteEnquiry = exports.UpdateEnquiry = exports.GetEnquiries = exports.Enquiry = void 0;
const prismacontro_1 = require("../prismacontro");
const Enquiry = async (req, res) => {
    console.log("Received enquiry data:", req.body);
    try {
        const { name, email, phone, message, course } = (req.body ?? {});
        if (!name || !email || !phone || !message || !course) {
            return res.status(400).json({ message: "all fields are required" });
        }
        const enquiry = await prismacontro_1.prisma.enquiry.create({
            data: {
                name,
                email,
                phone,
                message,
                course
            }
        });
        res.status(200).json({ message: "success", enquiry });
    }
    catch (error) {
        console.error("Enquiry create failed:", error);
        res.status(500).json({ message: "internal server error" });
    }
};
exports.Enquiry = Enquiry;
const GetEnquiries = async (req, res) => {
    try {
        const enquiries = await prismacontro_1.prisma.enquiry.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.status(200).json({
            message: "success",
            enquiries,
        });
    }
    catch (error) {
        console.error("Get enquiries failed:", error);
        return res.status(500).json({ message: "internal server error" });
    }
};
exports.GetEnquiries = GetEnquiries;
const UpdateEnquiry = async (req, res) => {
    try {
        const id = Number(req.params.id);
        // ✅ id validation
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid enquiry id" });
        }
        const { name, email, phone, message, course } = req.body;
        // ✅ required fields check
        if (!name || !email || !phone || !message || !course) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // ✅ check if enquiry exists
        const existingEnquiry = await prismacontro_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!existingEnquiry) {
            return res.status(404).json({ message: "Enquiry not found" });
        }
        // ✅ update enquiry
        const enquiry = await prismacontro_1.prisma.enquiry.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                message,
                course,
            },
        });
        return res.status(200).json({
            message: "Enquiry updated successfully",
            enquiry,
        });
    }
    catch (error) {
        console.error("Enquiry update failed:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.UpdateEnquiry = UpdateEnquiry;
const DeleteEnquiry = async (req, res) => {
    try {
        const id = Number(req.params.id);
        // ✅ id validation
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: "Invalid enquiry id" });
        }
        // ✅ check if enquiry exists
        const existingEnquiry = await prismacontro_1.prisma.enquiry.findUnique({
            where: { id },
        });
        if (!existingEnquiry) {
            return res.status(404).json({ message: "Enquiry not found" });
        }
        // ✅ delete enquiry
        await prismacontro_1.prisma.enquiry.delete({
            where: { id },
        });
        return res
            .status(200)
            .json({ message: "Enquiry deleted successfully" });
    }
    catch (error) {
        console.error("Enquiry deletion failed:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.DeleteEnquiry = DeleteEnquiry;
//# sourceMappingURL=index.js.map