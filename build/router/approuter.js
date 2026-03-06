"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Course_1 = require("../controler/Course");
const Admin_1 = require("../controler/Admin");
const Enquiry_1 = require("../controler/Enquiry");
const Profile_1 = require("../controler/Profile");
const Authentication_1 = require("../middleware/Authentication");
const SiteSettings_1 = require("../controler/SiteSettings");
const router = express_1.default.Router();
exports.router = router;
const uploadDir = path_1.default.resolve(process.cwd(), "uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.post("/login", upload.none(), Admin_1.LoginUser);
router.post("/forgot-password", upload.none(), Admin_1.ForgotAdminPassword);
router.get("/profile", Authentication_1.Authentication, Profile_1.GetProfile);
router.patch("/profiles", Authentication_1.Authentication, upload.single("avatar"), Profile_1.UpdateProfile);
router.post("/course", Course_1.CreateCourse);
router.get("/courses", Course_1.GetCourses);
router.get("/courses/:id", Course_1.GetCourseById);
router.patch("/courses/:id", Course_1.UpdateCourse);
router.delete("/courses/:id", Course_1.DeleteCourse);
router.post("/enquiry", Enquiry_1.Enquiry);
router.get("/enquiries", Enquiry_1.GetEnquiries);
router.patch("/enquiries/:id", Enquiry_1.UpdateEnquiry);
router.delete("/enquiries/:id", Enquiry_1.DeleteEnquiry);
router.get("/site-settings", SiteSettings_1.GetSiteSettings);
router.patch("/site-settings", Authentication_1.Authentication, SiteSettings_1.UpdateSiteSettings);
