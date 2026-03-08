"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetOtpEmail = exports.createMailTransport = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dns_1 = __importDefault(require("dns"));
try {
    dns_1.default.setDefaultResultOrder("ipv4first");
}
catch (_error) {
}
let transporter = null;
let mailInitLogged = false;
const getMailCredentials = () => {
    const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
    const user = rawUser.trim();
    const pass = rawPass.replace(/\s+/g, "");
    return { user, pass };
};
const getMailFrom = () => {
    const { user } = getMailCredentials();
    return process.env.MAIL_FROM || (user ? `Dream Animex <${user}>` : "");
};
const createMailTransport = () => {
    const { user, pass } = getMailCredentials();
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    if (!user || !pass) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        requireTLS: !secure,
        auth: {
            user,
            pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        tls: {
            rejectUnauthorized: false,
        },
    });
};
exports.createMailTransport = createMailTransport;
const getTransporter = () => {
    if (transporter) {
        return transporter;
    }
    const nextTransporter = (0, exports.createMailTransport)();
    if (!nextTransporter) {
        if (!mailInitLogged) {
            console.warn("Mail service not configured (missing SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD)");
            mailInitLogged = true;
        }
        return null;
    }
    if (!mailInitLogged) {
        nextTransporter.verify((error) => {
            if (error) {
                console.error("SMTP connection error:", error);
            }
            else {
                console.log("SMTP is ready to send emails");
            }
        });
        mailInitLogged = true;
    }
    transporter = nextTransporter;
    return transporter;
};
const sendResetOtpEmail = async (toEmail, otp) => {
    const mailFrom = getMailFrom();
    if (!mailFrom) {
        throw new Error("Mail sender address is not configured.");
    }
    const message = {
        from: mailFrom,
        to: toEmail,
        subject: "Dream Animex Password Reset OTP",
        text: `Your Dream Animex verification code is ${otp}. It is valid for 10 minutes.`,
        html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <h2 style="margin:0 0 12px;">Password Reset Verification</h2>
        <p style="margin:0 0 12px;">Use the following OTP to reset your password:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:10px 0 16px;color:#0f766e;">${otp}</p>
        <p style="margin:0 0 8px;">This code is valid for <strong>10 minutes</strong>.</p>
        <p style="margin:0;color:#6b7280;">If you did not request this, please ignore this email.</p>
      </div>
    `,
    };
    const mailTransporter = getTransporter();
    if (!mailTransporter) {
        throw new Error("Mail service is not configured.");
    }
    await mailTransporter.sendMail(message);
};
exports.sendResetOtpEmail = sendResetOtpEmail;
