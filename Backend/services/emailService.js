import nodemailer from "nodemailer";

// Helper function to create Nodemailer transporter
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Startup verification check
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  const transporter = createTransporter();
  transporter.verify((error) => {
    if (error) {
      console.error("❌ Gmail SMTP connection failed:", error.message);
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
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(`⚠️ EMAIL CREDENTIALS MISSING (EMAIL_USER / EMAIL_PASSWORD). Simulating email dispatch to ${to}`);
      console.log(`================ EMAIL LOG ================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log(`===========================================`);
      return {
        success: true,
        simulated: true,
        message: 'Email simulated in development mode.'
      };
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: subject || "RideMate - Email Verification OTP",
      text,
      html: html || `<div style="font-family: Arial, sans-serif;"><p>${text}</p></div>`,
    });

    console.log(`✅ Email sent successfully via Gmail SMTP to: ${to} (Message ID: ${info.messageId})`);

    return {
      success: true,
      info,
      messageId: info.messageId
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