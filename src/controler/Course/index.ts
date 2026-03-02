import { Request, Response } from "express";
import { prisma } from "../prismacontro";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function CreateCourse(req: Request, res: Response) {
  try {
    const { title, heading, description, duration } = req.body;

    // Check required fields
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!heading?.trim()) {
      return res.status(400).json({ message: "Heading is required" });
    }
    if (!description?.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }
    if (!duration?.trim()) {
      return res.status(400).json({ message: "Duration is required" });
    }

    const course = await prisma.course.create({
      data: {
        title,
        heading,
        description,
        duration,
      },
    });
    res.status(201).json(course);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      // Unique constraint failed (if title must be unique)
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Course title already exists' });
      }
    }
    console.error("Create course error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
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
        // Use the imported PrismaClientKnownRequestError directly
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") {
            return res.status(404).json({ error: "Course not found" });
        }
        res.status(500).json({ error: error.message });
    }
};