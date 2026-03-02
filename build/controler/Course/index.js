"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCourse = exports.UpdateCourse = exports.GetCourseById = exports.GetCourses = exports.CreateCourse = void 0;
const prismacontro_1 = require("../prismacontro");
const client_1 = require("@prisma/client");
const CreateCourse = async (req, res) => {
    try {
        const { title, description, heading, duration } = (req.body ?? {});
        if (!title || !description || !heading || !duration) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const course = await prismacontro_1.prisma.course.create({
            data: {
                title,
                description,
                heading,
                duration,
            },
        });
        res.status(201).json({ message: "Course created successfully", course });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.CreateCourse = CreateCourse;
const GetCourses = async (req, res) => {
    try {
        const courses = await prismacontro_1.prisma.course.findMany({
            select: {
                id: true,
                title: true,
                heading: true,
                description: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json(courses);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.GetCourses = GetCourses;
const GetCourseById = async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        if (!/^\d+$/.test(idParam)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const id = parseInt(idParam, 10);
        const course = await prismacontro_1.prisma.course.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                heading: true,
                description: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!course) {
            return res.status(404).json({ error: "Course not found" });
        }
        res.status(200).json(course);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.GetCourseById = GetCourseById;
const UpdateCourse = async (req, res) => {
    try {
        const { title, heading, duration, description } = req.body;
        const updateData = {};
        if (title?.trim())
            updateData.title = title;
        if (heading?.trim())
            updateData.heading = heading;
        if (duration?.trim())
            updateData.duration = duration;
        if (description !== undefined)
            updateData.description = description;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "No valid fields provided for update",
            });
        }
        const updatedCourse = await prismacontro_1.prisma.course.update({
            where: { id: Number(req.params.id) },
            data: updateData,
        });
        return res.status(200).json(updatedCourse);
    }
    catch (error) {
        console.error("UPDATE ERROR:", error);
        return res.status(500).json({
            error: error.message || "Something went wrong",
        });
    }
};
exports.UpdateCourse = UpdateCourse;
const DeleteCourse = async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        if (!/^\d+$/.test(idParam)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const id = parseInt(idParam, 10);
        const course = await prismacontro_1.prisma.course.delete({
            where: { id },
            select: {
                id: true,
                title: true,
                heading: true,
                description: true,
                duration: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(200).json(course);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ error: "Course not found" });
        }
        res.status(500).json({ error: error.message });
    }
};
exports.DeleteCourse = DeleteCourse;
//# sourceMappingURL=index.js.map