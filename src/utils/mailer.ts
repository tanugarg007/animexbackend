import nodemailer from "nodemailer";
import dns from "dns";

try {
  // Render environments can fail IPv6 SMTP routes; prefer IPv4 first for DNS lookups.
  dns.setDefaultResultOrder("ipv4first");
} catch (_error) {
  // Ignore if runtime does not support changing DNS result order.
}

let transporter: nodemailer.Transporter | null = null;
let mailInitLogged = false;

const getMailCredentials = () => {
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const user = rawUser.trim();
  // Gmail app passwords are often copied with spaces every 4 chars.
  const pass = rawPass.replace(/\s+/g, "");
  return { user, pass };
};

const getMailFrom = () => {
  const { user } = getMailCredentials();
  return process.env.MAIL_FROM || (user ? `Dream Animex <${user}>` : "");
};

export const createMailTransport = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const nextTransporter = createMailTransport();
  if (!nextTransporter) {
    if (!mailInitLogged) {
      console.warn(
        "Mail service not configured (missing SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD)"
      );
      mailInitLogged = true;
    }
    return null;
  }

  if (!mailInitLogged) {
    nextTransporter.verify((error) => {
      if (error) {
        console.error("SMTP connection error:", error);
      } else {
        console.log("SMTP is ready to send emails");
      }
    });
    mailInitLogged = true;
  }

  transporter = nextTransporter;
  return transporter;
};

export const sendResetOtpEmail = async (toEmail: string, otp: string) => {
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
