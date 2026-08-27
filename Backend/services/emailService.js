import nodemailer from "nodemailer";
import dns from "dns";

const customLookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { family: 4 }, callback);
};

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Check if email credentials exist
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

    const host = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;
    const isGmail = host.includes("gmail");

    const transportConfig = isGmail
      ? {
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          lookup: customLookup,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000
        }
      : {
          host: host,
          port: port,
          secure: port === 465,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          lookup: customLookup,
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false
          }
        };

    const transporter = nodemailer.createTransport(transportConfig);

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