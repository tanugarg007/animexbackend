import { Request, Response } from "express";
import { prisma } from "../prismacontro";
import { Prisma } from "@prisma/client";

export interface Course {
    title: string;
    description: string;
    heading?: string;
    duration?: string;
}
export const CreateCourse = async (req: Request, res: Response) => {
    try {
        const { title, description, heading, duration } = (req.body ?? {}) as Course;
        if (!title || !description || !heading || !duration) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const course = await prisma.course.create({
            data: {
                title,
                description,
                heading,
                duration,
            },
        })  ;
        res.status(201).json({ message: "Course created successfully", course });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }   
};

export const GetCourses = async (req: Request, res: Response) => {
    try {
        const courses = await prisma.course.findMany({
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const GetCourseById = async (req: Request, res: Response) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        if (!/^\d+$/.test(idParam)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const id = parseInt(idParam, 10);
        const course = await prisma.course.findUnique({
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
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const UpdateCourse = async (req: Request, res: Response) => {
  try {
    const { title, heading, duration, description } = req.body;

    const updateData: any = {};

    if (title?.trim()) updateData.title = title;
    if (heading?.trim()) updateData.heading = heading;
    if (duration?.trim()) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields provided for update",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: Number(req.params.id) },
      data: updateData,
    });

    return res.status(200).json(updatedCourse);

  } catch (error: any) {
    console.error("UPDATE ERROR:", error);
    return res.status(500).json({
      error: error.message || "Something went wrong",
    });
  }
};

export const DeleteCourse = async (req: Request, res: Response) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        if (!/^\d+$/.test(idParam)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const id = parseInt(idParam, 10);
        const course = await prisma.course.delete({
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
    } catch (error: any) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ error: "Course not found" });
        }
        res.status(500).json({ error: error.message });
    }
};
