import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { CreateCourse, GetCourses, GetCourseById, UpdateCourse, DeleteCourse } from "../controler/Course";
import { ForgotAdminPassword, LoginUser } from "../controler/Admin";
import { Enquiry, GetEnquiries, UpdateEnquiry, DeleteEnquiry } from "../controler/Enquiry";
import { GetProfile, UpdateProfile } from "../controler/Profile";
import { Authentication } from "../middleware/Authentication"; // ⚡ authentication middleware
import { GetSiteSettings, UpdateSiteSettings } from "../controler/SiteSettings";

const router = express.Router();

// Multer setup for uploads
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Auth routes
router.post("/login", upload.none(), LoginUser);
router.post("/forgot-password", upload.none(), ForgotAdminPassword);

// ✅ Profile routes (protected)
router.get("/profile", Authentication, GetProfile);
router.patch("/profiles", Authentication, upload.single("avatar"), UpdateProfile);


// Course routes
router.post("/course", CreateCourse);

router.get("/courses", GetCourses);
router.get("/courses/:id", GetCourseById);
router.patch("/courses/:id", UpdateCourse);
router.delete("/courses/:id", DeleteCourse);

// Enquiry routes
router.post("/enquiry",  Enquiry);
router.get("/enquiries", GetEnquiries);
router.patch("/enquiries/:id", UpdateEnquiry);
router.delete("/enquiries/:id", DeleteEnquiry);

router.get("/site-settings", GetSiteSettings);
router.patch("/site-settings", Authentication, UpdateSiteSettings);

export { router };
