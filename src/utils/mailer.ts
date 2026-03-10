import nodemailer from "nodemailer";
import dns from "dns";

try {
  // Render can prefer IPv6 routes that fail for some SMTP providers.
  dns.setDefaultResultOrder("ipv4first");
} catch (_error) {
  // Ignore for older runtimes.
}

type MailTransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
};

const getMailCredentials = () => {
  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const user = rawUser.trim();
  // Gmail app passwords are frequently copied with spaces.
  const pass = rawPass.replace(/\s+/g, "");
  return { user, pass };
};

const getPrimaryTransportConfig = (): MailTransportConfig | null => {
  const { user, pass } = getMailCredentials();
  if (!user || !pass) return null;

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;

  return { host, port, secure, user, pass };
};

const createTransporter = (config: MailTransportConfig) =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    family: 4,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: false,
    },
  } as nodemailer.TransportOptions);

const isConnectionError = (error: unknown) => {
  const err = error as { code?: string };
  const code = (err?.code || "").toUpperCase();
  return code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET";
};

const buildFallbackConfigs = (config: MailTransportConfig): MailTransportConfig[] => {
  const candidates: Array<{ port: number; secure: boolean }> = [];
  if (config.port === 587) candidates.push({ port: 465, secure: true }, { port: 2525, secure: false });
  else if (config.port === 465) candidates.push({ port: 587, secure: false }, { port: 2525, secure: false });
  else if (config.port === 2525) candidates.push({ port: 587, secure: false }, { port: 465, secure: true });
  else candidates.push({ port: 587, secure: false }, { port: 465, secure: true }, { port: 2525, secure: false });

  return candidates.map((c) => ({ ...config, port: c.port, secure: c.secure }));
};

const getMailFrom = () => {
  const { user } = getMailCredentials();
return process.env.MAIL_FROM || (user ? `<${user}>` : "");
};

export const sendResetOtpEmail = async (toEmail: string, otp: string) => {
  const config = getPrimaryTransportConfig();
  if (!config) {
    throw new Error("Mail service is not configured.");
  }

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

  const transportConfigs = [config, ...buildFallbackConfigs(config)];
  let lastError: unknown = null;

  for (let i = 0; i < transportConfigs.length; i += 1) {
    const t = transportConfigs[i];
    if (!t) continue;
    try {
      const transporter = createTransporter(t);
      await transporter.sendMail(message);
      return;
    } catch (err) {
      lastError = err;
      if (!isConnectionError(err) || i === transportConfigs.length - 1) {
        throw err;
      }
    }
  }

  if (lastError) throw lastError;
};
