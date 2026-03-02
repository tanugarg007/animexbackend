"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteUser = exports.UpdateUser = exports.GetUserById = exports.GetUsers = exports.CreateUser = void 0;
const prismacontro_1 = require("../prismacontro");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const CreateUser = async (req, res) => {
    try {
        const SECRET_KEY = process.env.JWT_SECRET;
        if (!SECRET_KEY) {
            throw new Error('JWT_SECRET must be defined in environment variables');
        }
        const { email, password } = (req.body ?? {});
        if (!email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const existingUser = await prismacontro_1.prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return res.status(409).json({ error: "User exists" });
        const salt = await bcrypt_1.default.genSalt(10);
        const hashPassword = await bcrypt_1.default.hash(password, salt);
        const user = await prismacontro_1.prisma.user.create({
            data: { email, password: hashPassword },
            select: { id: true, email: true, password: true },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, sameSite: 'strict' });
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, }, token, status: 201 });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
exports.CreateUser = CreateUser;
const GetUsers = async (req, res) => {
    try {
        const users = await prismacontro_1.prisma.user.findMany({
            select: {
                email: true
            }
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.GetUsers = GetUsers;
const GetUserById = async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        const id = parseInt(idParam, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const user = await prismacontro_1.prisma.user.findUnique({
            where: { id },
            select: {
                email: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.GetUserById = GetUserById;
const UpdateUser = async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        const id = parseInt(idParam, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const { email, password } = (req.body ?? {});
        if (!email && !password) {
            return res.status(400).json({ error: "No valid fields provided for update" });
        }
        // Prepare update data
        const updateData = {};
        if (email)
            updateData.email = email;
        if (password) {
            // Hash new password if provided
            updateData.password = await bcrypt_1.default.hash(password, 10);
        }
        const user = await prismacontro_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
            },
        });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.UpdateUser = UpdateUser;
const DeleteUser = async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!idParam) {
            return res.status(400).json({ error: "Invalid or missing id parameter" });
        }
        const id = parseInt(idParam, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ error: "Invalid id parameter" });
        }
        const user = await prismacontro_1.prisma.user.delete({
            where: { id },
            select: {
                email: true
            }
        });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.DeleteUser = DeleteUser;
//# sourceMappingURL=index.js.map