import {Request,Response} from 'express';
import { prisma } from "../prismacontro";
const NAME_REGEX = /^[A-Za-z ]+$/;

interface Enquiry{
   name:string,
   email:string,
   phone: string,
   city: string,
   message:string,
   course:string
}
export const Enquiry = async (req: Request, res:Response):Promise<any> => {
  console.log("Received enquiry data:", req.body);
   try{
       const { name, email, phone, city, message, course } = (req.body ?? {}) as Partial<Enquiry>;
       if(!name || !email || !phone || !city || !message || !course){
         return res.status(400).json({message:"all fields are required"})
       }
       const normalizedName = name.trim();
       const normalizedEmail = email.trim().toLowerCase();
       const normalizedPhone = phone.trim();
       const normalizedCity = city.trim();
       const normalizedMessage = message.trim();
       const normalizedCourse = course.trim();

       if (!normalizedCity || !normalizedMessage || !normalizedCourse) {
         return res.status(400).json({ message: "all fields are required" });
       }

       if (!NAME_REGEX.test(normalizedName)) {
         return res.status(400).json({ message: "Name can contain only letters and spaces" });
       }
       const enquiry = await prisma.enquiry.create({
         data:{
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            city: normalizedCity || "N/A",
            message: normalizedMessage,
            course: normalizedCourse
         }
       })
       res.status(200).json({message:"success",enquiry})    
   }
   catch(error){
      console.error("Enquiry create failed:", error);
      res.status(500).json({message:"internal server error"})
   }
}

export const GetEnquiries = async (req: Request, res: Response): Promise<any> => {
   try {
      const enquiries = await prisma.enquiry.findMany({
         orderBy: {
            createdAt: "desc",
         },
      });

      return res.status(200).json({
         message: "success",
         enquiries,
      });
   } catch (error) {
      console.error("Get enquiries failed:", error);
      return res.status(500).json({ message: "internal server error" });
   }
};

export const UpdateEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);

    // ✅ id validation
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid enquiry id" });
    }

    const { name, email, phone, city, message, course } =
      req.body as Partial<Enquiry>;

    // ✅ required fields check
    if (!name || !email || !phone || !city || !message || !course) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedCity = city.trim();
    const normalizedMessage = message.trim();
    const normalizedCourse = course.trim();

    if (!normalizedCity || !normalizedMessage || !normalizedCourse) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!NAME_REGEX.test(normalizedName)) {
      return res.status(400).json({ message: "Name can contain only letters and spaces" });
    }

    // ✅ check if enquiry exists
    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!existingEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    // ✅ update enquiry
    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        city: normalizedCity,
        message: normalizedMessage,
        course: normalizedCourse,
      },
    });

    return res.status(200).json({
      message: "Enquiry updated successfully",
      enquiry,
    });
  } catch (error) {
    console.error("Enquiry update failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const DeleteEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = Number(req.params.id);

    // ✅ id validation
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "Invalid enquiry id" });
    }

    // ✅ check if enquiry exists
    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!existingEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    // ✅ delete enquiry
    await prisma.enquiry.delete({
      where: { id },
    });

    return res
      .status(200)
      .json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    console.error("Enquiry deletion failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
