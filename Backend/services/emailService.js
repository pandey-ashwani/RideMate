import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const lookupIPv4 = promisify((hostname, cb) => dns.lookup(hostname, { family: 4 }, cb));

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

    const rawHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;

    // Resolve hostname explicitly to an IPv4 IP address string
    let resolvedHost = rawHost;
    try {
      const ipv4 = await lookupIPv4(rawHost);
      if (ipv4) {
        resolvedHost = ipv4;
        console.log(`🌐 Resolved ${rawHost} -> IPv4 ${resolvedHost}`);
      }
    } catch (dnsErr) {
      console.warn(`⚠️ DNS IPv4 lookup warning for ${rawHost}:`, dnsErr.message);
    }

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
        servername: rawHost
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000
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