import nodemailer from "nodemailer";
import net from "node:net";

// Create Gmail SMTP transporter using a forced IPv4 socket
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    getSocket: (options, callback) => {
      const socket = net.connect({
        host: "smtp.gmail.com",
        port: 587,
        family: 4,
      });

      socket.once("connect", () => {
        callback(null, {
          connection: socket,
        });
      });

      socket.once("error", (error) => {
        callback(error);
      });
    },

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },

    requireTLS: true,

    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
};

/**
 * Send email using Gmail SMTP
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error(
        "EMAIL_USER or EMAIL_PASSWORD is missing"
      );
    }

    const transporter = createTransporter();

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

    console.log(
      `✅ Email sent successfully to: ${to}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(
      "❌ Gmail SMTP Email sending failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

export default sendEmail;