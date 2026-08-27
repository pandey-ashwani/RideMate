import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const lookupIPv4 = promisify((hostname, cb) => dns.lookup(hostname, { family: 4 }, cb));

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const senderEmail = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || "noreply@ridemate.com";
    const senderName = process.env.EMAIL_FROM_NAME || "RideMate";

    // 1. Brevo HTTP REST API (Recommended for Render cloud hosting over Port 443)
    if (process.env.BREVO_API_KEY || process.env.EMAIL_PROVIDER === 'brevo') {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) throw new Error("BREVO_API_KEY is missing in environment variables");

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html || `<p>${text}</p>`,
          textContent: text
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || resData.code || "Brevo API email send failed");
      }

      console.log(`✅ Email sent successfully via Brevo HTTPS API to: ${to} (ID: ${resData.messageId})`);
      return { success: true, messageId: resData.messageId, provider: 'brevo' };
    }

    // 2. Resend HTTP REST API (Over Port 443)
    if (process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY is missing in environment variables");

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [to],
          subject,
          html: html || `<p>${text}</p>`,
          text
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || resData.name || "Resend API email send failed");
      }

      console.log(`✅ Email sent successfully via Resend HTTPS API to: ${to} (ID: ${resData.id})`);
      return { success: true, messageId: resData.id, provider: 'resend' };
    }

    // 3. Fallback: SMTP (Gmail / Custom SMTP)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn(`⚠️ EMAIL CREDENTIALS MISSING (EMAIL_USER / EMAIL_PASSWORD). Simulating email dispatch to ${to}`);
      console.log(`================ EMAIL LOG ================`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      console.log(`===========================================`);
      return { success: true, simulated: true, message: 'Email simulated in development mode.' };
    }

    const rawHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;

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
      from: process.env.EMAIL_FROM || `"${senderName}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family: Arial, sans-serif;"><p>${text}</p></div>`,
    });

    console.log(`✅ Email sent successfully via SMTP to: ${to} (Message ID: ${info.messageId})`);
    return { success: true, info };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;