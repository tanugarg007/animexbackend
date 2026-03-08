import { Request, Response } from "express";
import { prisma } from "../prismacontro";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { sendResetOtpEmail } from "../../utils/mailer";

type ResetOtpSession = {
  otpHash: string;
  expiresAt: number;
  attemptsLeft: number;
  lastRequestedAt: number;
  requestCount: number;
  requestWindowStart: number;
  lockUntil?: number;
};

const resetOtpSessions = new Map<string, ResetOtpSession>();
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_REQUESTS_IN_WINDOW = 5;
const REQUEST_WINDOW_MS = 30 * 60 * 1000;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const buildPasswordPolicyMessage = () =>
  "Password must be at least 8 characters and include upper, lower, number and special character.";

const createNumericOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const getLockedResponse = (res: Response, lockUntil: number) => {
  const waitSeconds = Math.max(1, Math.ceil((lockUntil - Date.now()) / 1000));
  return res.status(429).json({
    message: `Too many attempts. Try again in ${waitSeconds} seconds.`,
  });
};

const verifyCurrentPasswordChange = async (
  req: Request,
  res: Response,
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required for password change." });
    return false;
  }

  let tokenPayload: JwtPayload & { id?: number | string; email?: string };
  try {
    tokenPayload = jwt.verify(
      authHeader.slice(7).trim(),
      process.env.JWT_SECRET || "secretkey"
    ) as JwtPayload & { id?: number | string; email?: string };
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired session. Please login again." });
    return false;
  }

  if (tokenPayload.email && tokenPayload.email.toLowerCase() !== email) {
    res.status(403).json({ message: "You can only change your own password." });
    return false;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return false;
  }

  const currentMatch = await bcrypt.compare(currentPassword, user.password);
  if (!currentMatch) {
    res.status(400).json({ message: "Current password is incorrect." });
    return false;
  }

  if (!PASSWORD_POLICY.test(newPassword)) {
    res.status(400).json({ message: buildPasswordPolicyMessage() });
    return false;
  }

  const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
  if (isSameAsOldPassword) {
    res.status(400).json({ message: "New password must be different from current password." });
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  res.status(200).json({ message: "Password changed successfully." });
  return true;
};

// ------------------------------
// Login / First Admin Creation
// ------------------------------
export const LoginUser = async (req: Request, res: Response) => {
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

    // ------------------------------
    // Check total users
    // ------------------------------
    let totalUsers: number;
    try {
      totalUsers = await prisma.user.count();
      console.log("Total users in DB:", totalUsers);
    } catch (err) {
      console.error("Prisma count failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // ------------------------------
    // Check if user exists
    // ------------------------------
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      console.log("Existing user:", existingUser);
    } catch (err) {
      console.error("Prisma findUnique failed:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // ------------------------------
    // First ever login: create admin
    // ------------------------------
    if (totalUsers === 0 && !existingUser) {
      let hashedPassword: string;
      try {
        hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed for first admin");
      } catch (err) {
        console.error("Password hashing failed:", err);
        return res.status(500).json({ message: "Password hashing error" });
      }

      let admin;
      try {
        admin = await prisma.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: "ADMIN",
          },
        });
        console.log("First admin created:", admin);
      } catch (err) {
        console.error("Prisma create admin failed:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email },
        process.env.JWT_SECRET || "secretkey",
        { expiresIn: "1d" }
      );
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

    // ------------------------------
    // Normal login
    // ------------------------------
    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    let isMatch: boolean;
    try {
      isMatch = await bcrypt.compare(password, existingUser.password);
      console.log("Password comparison result:", isMatch);
    } catch (err) {
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

    const token = jwt.sign(
      { id: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );
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
  } catch (error: any) {
    console.error("Unexpected login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------
// Forgot / Reset Admin Password
// ------------------------------
export const ForgotAdminPassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { action, email, currentPassword, otp, newPassword } = req.body as {
      action?: "request" | "verify";
      email?: string;
      currentPassword?: string;
      otp?: string;
      newPassword?: string;
    };
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (currentPassword && newPassword) {
      return verifyCurrentPasswordChange(
        req,
        res,
        normalizedEmail,
        currentPassword,
        newPassword
      );
    }

    if (action === "request") {
      const now = Date.now();
      const existingSession = resetOtpSessions.get(normalizedEmail);

      if (existingSession?.lockUntil && existingSession.lockUntil > now) {
        return getLockedResponse(res, existingSession.lockUntil);
      }

      if (
        existingSession?.lastRequestedAt &&
        now - existingSession.lastRequestedAt < OTP_RESEND_COOLDOWN_MS
      ) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existingSession.lastRequestedAt)) / 1000)
        );
        return res.status(429).json({
          message: `Please wait ${retryAfterSeconds} seconds before requesting again.`,
          resendAfterSeconds: retryAfterSeconds,
        });
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        return res.status(200).json({
          message:
            "If the account exists, a verification code has been sent. Use it to continue reset.",
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
      const otpHash = await bcrypt.hash(plainOtp, 10);
      resetOtpSessions.set(normalizedEmail, {
        otpHash,
        expiresAt: now + OTP_EXPIRY_MS,
        attemptsLeft: MAX_VERIFY_ATTEMPTS,
        lastRequestedAt: now,
        requestCount,
        requestWindowStart,
      });

      try {
        await sendResetOtpEmail(normalizedEmail, plainOtp);
      } catch (mailError) {
        const allowOtpFallback = process.env.ALLOW_RESET_OTP_IN_RESPONSE === "true";
        console.error("Failed to send reset OTP email:", mailError);

        if (allowOtpFallback) {
          return res.status(200).json({
            message:
              "Email service is unavailable. Use temporary OTP shown below to continue reset.",
            expiresInSeconds: Math.ceil(OTP_EXPIRY_MS / 1000),
            resendAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
            debugOtp: plainOtp,
          });
        }

        resetOtpSessions.delete(normalizedEmail);
        return res.status(503).json({
          message:
            "Password reset email service is unavailable. Please try again later or contact support.",
        });
      }

      const payload: {
        message: string;
        expiresInSeconds: number;
        resendAfterSeconds: number;
      } = {
        message:
          "Verification code sent to your registered email. Enter the 6-digit code to continue password reset.",
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

      const isOtpValid = await bcrypt.compare(otp.trim(), session.otpHash);
      if (!isOtpValid) {
        const attemptsLeft = session.attemptsLeft - 1;
        const nextSession = { ...session, attemptsLeft };
        if (attemptsLeft <= 0) {
          nextSession.lockUntil = now + LOCK_DURATION_MS;
        }
        resetOtpSessions.set(normalizedEmail, nextSession);
        return res.status(400).json({
          message:
            attemptsLeft > 0
              ? `Invalid verification code. Attempts left: ${attemptsLeft}.`
              : "Too many invalid attempts. Reset has been temporarily locked.",
        });
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        resetOtpSessions.delete(normalizedEmail);
        return res.status(404).json({ message: "Account not found." });
      }

      const isSameAsOldPassword = await bcrypt.compare(newPassword, user.password);
      if (isSameAsOldPassword) {
        return res.status(400).json({
          message: "New password must be different from previous password.",
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
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
  } catch (error: any) {
    console.error("Unexpected forgot password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
