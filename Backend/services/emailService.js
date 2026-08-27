import nodemailer from "nodemailer";
import dns from "node:dns/promises";

// Create Gmail SMTP transporter
const createTransporter = async () => {
  // Explicitly resolve an IPv4 address
  const addresses = await dns.resolve4("smtp.gmail.com");

  console.log(`📡 Gmail SMTP IPv4: ${addresses[0]}`);

  return nodemailer.createTransport({
    host: addresses[0], // Use IPv4 directly
    port: 587,
    secure: false,

    requireTLS: true,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },

    // Important: connect to Gmail IP but use smtp.gmail.com for TLS
    tls: {
      servername: "smtp.gmail.com",
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
};

// Send email
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error("EMAIL_USER or EMAIL_PASSWORD is missing");
    }

    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: subject || "RideMate - Email Verification OTP",
      text,
      html:
        html ||
        `<div style="font-family: Arial, sans-serif;">
          <p>${text}</p>
        </div>`,
    });

    console.log(`✅ Email sent successfully to: ${to}`);

    return {
      success: true,
      info,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Gmail SMTP Email sending failed:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default sendEmail;