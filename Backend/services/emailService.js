import nodemailer from "nodemailer";


export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Check that required environment variables exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error(
        "Email credentials are missing. Check EMAIL_USER and EMAIL_PASSWORD in your .env file."
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: Number(process.env.EMAIL_PORT || 465) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from:
        process.env.EMAIL_FROM ||
        `"RideMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html:
        html ||
        `<div style="font-family: Arial, sans-serif;">
          <p>${text}</p>
        </div>`,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      info,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

export default sendEmail;