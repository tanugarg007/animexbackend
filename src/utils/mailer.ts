import nodemailer from "nodemailer";

const createMailTransport = () => {
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
const transporter = createMailTransport();
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ SMTP connection error:', error);
    } else {
      console.log('✅ SMTP is ready to send emails');
    }
  });
} else {
  console.warn('⚠️ Mail service not configured (missing GMAIL_USER or GMAIL_APP_PASSWORD)');
}
export const sendResetOtpEmail = async (toEmail: string, otp: string) => {
  // const transporter = createMailTransport();
  // const gmailUser = process.env.GMAIL_USER;
  // const mailFrom = process.env.MAIL_FROM || (gmailUser ? `Dream Animex <${gmailUser}>` : "");

  if (!transporter ) {
    throw new Error("Mail service is not configured.");
  }
 const gmailUser = process.env.GMAIL_USER;
  const mailFrom = process.env.MAIL_FROM || (gmailUser ? `Dream Animex <${gmailUser}>` : "");
   if (!mailFrom) {
    throw new Error("Mail sender address is not configured.");
  }
  await transporter.sendMail({
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
  });
};
