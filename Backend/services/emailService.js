import nodemailer from "nodemailer";

// Create Gmail SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,

    logger: true,
    debug: true,
  });
};

// Startup verification check
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  const transporter = createTransporter();

  transporter.verify((error) => {
    if (error) {
      console.error("❌ Gmail SMTP verification failed:");
      console.error(error);
    } else {
      console.log("✅ Gmail SMTP connection ready");
    }
  });
}

/**
 * Sends an email using Nodemailer with Gmail SMTP
 * @param {Object} options - { to, subject, text, html }
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const fromAddress =
      process.env.EMAIL_FROM || process.env.EMAIL_USER;

    // Check credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(
        "⚠️ EMAIL_USER or EMAIL_PASSWORD is missing."
      );

      return {
        success: false,
        error: "Email credentials are missing",
      };
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
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
      `✅ Email sent successfully via Gmail SMTP to: ${to}`
    );

    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      info,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Gmail SMTP Email sending failed:");
    console.error(error);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default sendEmail;