"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgotAdminPassword = exports.LoginUser = void 0;
const prismacontro_1 = require("../prismacontro");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailer_1 = require("../../utils/mailer");
const resetOtpSessions = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_IN_WINDOW = 5;
const REQUEST_WINDOW_MS = 30 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
const buildPasswordPolicyMessage = () => "Password must be at least 8 characters and include upper, lower, number and special character.";
const createNumericOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const getLockedResponse = (res, lockUntil) => {
    const waitSeconds = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
    return res.status(429).json({
        message: `Too many attempts. Try again in ${waitSeconds} seconds.`,
    });
};
const verifyCurrentPasswordChange = async (req, res, email, currentPassword, newPassword) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authentication required for password change." });
        return false;
    }
    let tokenPayload;
    try {
        tokenPayload = jsonwebtoken_1.default.verify(authHeader.slice(7).trim(), process.env.JWT_SECRET || "secretkey");
    }
    catch (_error) {
        res.status(401).json({ message: "Invalid or expired session. Please login again." });
        return false;
    }
    if (tokenPayload.email && tokenPayload.email.toLowerCase() !== email) {
        res.status(403).json({ message: "You can only change your own password." });
        return false;
    }
    const user = await prismacontro_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(404).json({ message: "User not found." });
        return false;
    }
    const currentMatch = await bcrypt_1.default.compare(currentPassword, user.password);
    if (!currentMatch) {
        res.status(400).json({ message: "Current password is incorrect." });
        return false;
    }
    if (!PASSWORD_POLICY.test(newPassword)) {
        res.status(400).json({ message: buildPasswordPolicyMessage() });
        return false;
    }
    const isSameAsOldPassword = await bcrypt_1.default.compare(newPassword, user.password);
    if (isSameAsOldPassword) {
        res.status(400).json({ message: "New password must be different from current password." });
        return false;
    }
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    await prismacontro_1.prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
    });
    res.status(200).json({ message: "Password changed successfully." });
    return true;
};
const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request body:", req.body);
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required",
                fieldErrors: {
                    email: !email ? "Email is required" : "",
                    password: !password ? "Password is required" : "",
                },
            });
        }
        const normalizedEmail = email.toLowerCase().trim();
        let totalUsers;
        try {
            totalUsers = await prismacontro_1.prisma.user.count();
            console.log("Total users in DB:", totalUsers);
        }
        catch (err) {
            console.error("Prisma count failed:", err);
            return res.status(500).json({ message: "Database error" });
        }
        let existingUser;
        try {
            existingUser = await prismacontro_1.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            console.log("Existing user:", existingUser);
        }
        catch (err) {
            console.error("Prisma findUnique failed:", err);
            return res.status(500).json({ message: "Database error" });
        }
        if (totalUsers === 0 && !existingUser) {
            let hashedPassword;
            try {
                hashedPassword = await bcrypt_1.default.hash(password, 10);
                console.log("Password hashed for first admin");
            }
            catch (err) {
                console.error("Password hashing failed:", err);
                return res.status(500).json({ message: "Password hashing error" });
            }
            let admin;
            try {
                admin = await prismacontro_1.prisma.user.create({
                    data: {
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: "ADMIN",
                    },
                });
                console.log("First admin created:", admin);
            }
            catch (err) {
                console.error("Prisma create admin failed:", err);
                return res.status(500).json({ message: "Database error" });
            }
            const token = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET || "secretkey", { expiresIn: "1d" });
            console.log("JWT created for first admin");
            return res.json({
                message: "Login successful",
                token,
                user: {
                    id: admin.id,
                    name: admin.name || "Admin",
                    email: admin.email,
                    role: admin.role,
                    avatar: admin.avatar || null,
                },
                admin: {
                    id: admin.id,
                    name: admin.name || "Admin",
                    email: admin.email,
                    role: admin.role,
                    avatar: admin.avatar || null,
                },
            });
        }
        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }
        let isMatch;
        try {
            isMatch = await bcrypt_1.default.compare(password, existingUser.password);
            console.log("Password comparison result:", isMatch);
        }
        catch (err) {
            console.error("Password compare failed:", err);
            return res.status(500).json({ message: "Password comparison error" });
        }
        if (!isMatch) {
            return res.status(401).json({
                message: "Wrong password",
                fieldErrors: {
                    email: "",
                    password: "Wrong password",
                },
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: existingUser.id, email: existingUser.email }, process.env.JWT_SECRET || "secretkey", { expiresIn: "1d" });
        console.log("JWT created for user:", existingUser.id);
        return res.json({
            message: "Login successful",
            token,
            user: {
                id: existingUser.id,
                name: existingUser.name || "User",
                email: existingUser.email,
                role: existingUser.role,
                avatar: existingUser.avatar || null,
            },
            admin: {
                id: existingUser.id,
                name: existingUser.name || "User",
                email: existingUser.email,
                role: existingUser.role,
                avatar: existingUser.avatar || null,
            },
        });
    }
    catch (error) {
        console.error("Unexpected login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.LoginUser = LoginUser;
const ForgotAdminPassword = async (req, res) => {
    try {
        const { action, email, currentPassword, otp, newPassword } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Enter a valid email address." });
        }
        if (currentPassword && newPassword) {
            return verifyCurrentPasswordChange(req, res, normalizedEmail, currentPassword, newPassword);
        }
        if (action === "request") {
            const now = Date.now();
            const existingSession = resetOtpSessions.get(normalizedEmail);
            if (existingSession?.lockUntil && existingSession.lockUntil > now) {
                return getLockedResponse(res, existingSession.lockUntil);
            }
            if (existingSession?.lastRequestedAt &&
                now - existingSession.lastRequestedAt < OTP_RESEND_COOLDOWN_MS) {
                const retryAfterSeconds = Math.max(1, Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existingSession.lastRequestedAt)) / 1000));
                return res.status(429).json({
                    message: `Please wait ${retryAfterSeconds} seconds before requesting again.`,
                    resendAfterSeconds: retryAfterSeconds,
                });
            }
            const user = await prismacontro_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (!user) {
                return res.status(200).json({
                    message: "If the account exists, a verification code has been sent. Use it to continue reset.",
                    resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
                });
            }
            let requestCount = 1;
            let requestWindowStart = now;
            if (existingSession) {
                const sameWindow = now - existingSession.requestWindowStart <= REQUEST_WINDOW_MS;
                requestWindowStart = sameWindow ? existingSession.requestWindowStart : now;
                requestCount = sameWindow ? existingSession.requestCount + 1 : 1;
            }
            if (requestCount > MAX_REQUESTS_IN_WINDOW) {
                const lockUntil = now + LOCK_DURATION_MS;
                resetOtpSessions.set(normalizedEmail, {
                    ...(existingSession || {
                        otpHash: "",
                        expiresAt: 0,
                        attemptsLeft: MAX_VERIFY_ATTEMPTS,
                        lastRequestedAt: now,
                    }),
                    requestCount,
                    requestWindowStart,
                    lockUntil,
                });
                return getLockedResponse(res, lockUntil);
            }
            const plainOtp = createNumericOtp();
            const otpHash = await bcrypt_1.default.hash(plainOtp, 10);
            resetOtpSessions.set(normalizedEmail, {
                otpHash,
                expiresAt: now + OTP_EXPIRY_MS,
                attemptsLeft: MAX_VERIFY_ATTEMPTS,
                lastRequestedAt: now,
                requestCount,
                requestWindowStart,
            });
            try {
                await (0, mailer_1.sendResetOtpEmail)(normalizedEmail, plainOtp);
            }
            catch (mailError) {
                const allowOtpFallback = process.env.ALLOW_RESET_OTP_IN_RESPONSE === "true";
                const mailErr = mailError;
                console.error("Failed to send reset OTP email:", mailErr);
                if (allowOtpFallback) {
                    return res.status(200).json({
                        message: "Email service is unavailable. Use temporary OTP shown below to continue reset.",
                        expiresInSeconds: Math.ceil(OTP_EXPIRY_MS / 1000),
                        resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
                        debugOtp: plainOtp,
                    });
                }
                resetOtpSessions.delete(normalizedEmail);
                const debugDetails = process.env.MAIL_DEBUG_ERRORS === "true";
                const errCode = (mailErr?.code || "").toUpperCase();
                const errMessage = (mailErr?.message || "").toLowerCase();
                let message = "Password reset email service is unavailable. Please try again later or contact support.";
                if (errMessage.includes("not configured")) {
                    message = "Email service is not configured on server. Please contact support.";
                }
                else if (errCode === "EAUTH" ||
                    errMessage.includes("invalid login") ||
                    errMessage.includes("bad credentials")) {
                    message = "Email service authentication failed. Please contact support.";
                }
                else if (errCode === "ETIMEDOUT" ||
                    errCode === "ECONNECTION" ||
                    errCode === "ESOCKET") {
                    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
                    const smtpPort = process.env.SMTP_PORT || "465";
                    message = `Email server (${smtpHost}:${smtpPort}) is unreachable right now. Please try again shortly.`;
                }
                return res.status(503).json({
                    message,
                    ...(debugDetails
                        ? {
                            errorCode: mailErr?.code || null,
                            errorDetails: mailErr?.response || mailErr?.message || null,
                        }
                        : {}),
                });
            }
            const payload = {
                message: "Verification code sent to your registered email. Enter the 6-digit code to continue password reset.",
                expiresInSeconds: Math.ceil(OTP_EXPIRY_MS / 1000),
                resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
            };
            return res.status(200).json(payload);
        }
        if (action === "verify") {
            if (!otp || !newPassword) {
                return res.status(400).json({
                    message: "Verification code and new password are required.",
                });
            }
            if (!PASSWORD_POLICY.test(newPassword)) {
                return res.status(400).json({ message: buildPasswordPolicyMessage() });
            }
            const now = Date.now();
            const session = resetOtpSessions.get(normalizedEmail);
            if (!session) {
                return res.status(400).json({
                    message: "No active reset request. Please request a new verification code.",
                });
            }
            if (session.lockUntil && session.lockUntil > now) {
                return getLockedResponse(res, session.lockUntil);
            }
            if (session.expiresAt < now) {
                resetOtpSessions.delete(normalizedEmail);
                return res.status(400).json({
                    message: "Verification code expired. Request a new code.",
                });
            }
            if (session.attemptsLeft <= 0) {
                const lockUntil = now + LOCK_DURATION_MS;
                resetOtpSessions.set(normalizedEmail, {
                    ...session,
                    lockUntil,
                });
                return getLockedResponse(res, lockUntil);
            }
            const isOtpValid = await bcrypt_1.default.compare(otp.trim(), session.otpHash);
            if (!isOtpValid) {
                const attemptsLeft = session.attemptsLeft - 1;
                const nextSession = { ...session, attemptsLeft };
                if (attemptsLeft <= 0) {
                    nextSession.lockUntil = now + LOCK_DURATION_MS;
                }
                resetOtpSessions.set(normalizedEmail, nextSession);
                return res.status(400).json({
                    message: attemptsLeft > 0
                        ? `Invalid verification code. Attempts left: ${attemptsLeft}.`
                        : "Too many invalid attempts. Reset has been temporarily locked.",
                });
            }
            const user = await prismacontro_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (!user) {
                resetOtpSessions.delete(normalizedEmail);
                return res.status(404).json({ message: "Account not found." });
            }
            const isSameAsOldPassword = await bcrypt_1.default.compare(newPassword, user.password);
            if (isSameAsOldPassword) {
                return res.status(400).json({
                    message: "New password must be different from previous password.",
                });
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
            await prismacontro_1.prisma.user.update({
                where: { email: normalizedEmail },
                data: { password: hashedPassword },
            });
            resetOtpSessions.delete(normalizedEmail);
            return res.status(200).json({
                message: "Password reset successful. Please login with your new password.",
            });
        }
        return res.status(400).json({
            message: "Invalid action. Use action='request' or action='verify'.",
        });
    }
    catch (error) {
        console.error("Unexpected forgot password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.ForgotAdminPassword = ForgotAdminPassword;
