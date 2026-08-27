import nodemailer from "nodemailer";
import dns from "dns";
import { promisify } from "util";

const lookupIPv4 = promisify((hostname, cb) => dns.lookup(hostname, { family: 4 }, cb));

export const sendEmail = async ({ to, subject, text, html }) => {
  const provider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase().trim();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
  const senderName = process.env.EMAIL_FROM_NAME || 'RideMate';

  // Format sender cleanly as "Name <email@domain.com>" if not formatted
  const formattedFrom = fromAddress.includes('<')
    ? fromAddress
    : `"${senderName}" <${fromAddress}>`;

  // =========================================================================
  // 1. RESEND PROVIDER (HTTPS REST API - PREFERRED FOR RENDER)
  // =========================================================================
  if (provider === 'resend' || process.env.RESEND_API_KEY) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ RESEND_API_KEY is missing in environment variables.");
      return { success: false, error: "RESEND_API_KEY is required for Resend HTTPS email provider" };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: formattedFrom,
          to: [to],
          subject: subject,
          html: html || `<p>${text}</p>`,
          text: text
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("❌ Resend API Error:", resData.message || resData.name || "Failed to send email");
        return { success: false, error: resData.message || "Resend email delivery failed" };
      }

      console.log(`✅ Email sent via Resend HTTPS API to: ${to} (ID: ${resData.id})`);
      return { success: true, messageId: resData.id, provider: 'resend' };
    } catch (err) {
      console.error("❌ Resend network request error:", err.message);
      return { success: false, error: "Resend network request failed" };
    }
  }

  // =========================================================================
  // 2. BREVO PROVIDER (HTTPS REST API - ALTERNATIVE)
  // =========================================================================
  if (provider === 'brevo' || process.env.BREVO_API_KEY) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("❌ BREVO_API_KEY is missing in environment variables.");
      return { success: false, error: "BREVO_API_KEY is required for Brevo HTTPS email provider" };
    }

    try {
      let cleanEmail = fromAddress;
      if (fromAddress.includes('<') && fromAddress.includes('>')) {
        cleanEmail = fromAddress.match(/<([^>]+)>/)?.[1] || fromAddress;
      }

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: cleanEmail },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html || `<p>${text}</p>`,
          textContent: text
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        console.error("❌ Brevo API Error:", resData.message || resData.code || "Failed to send email");
        return { success: false, error: resData.message || "Brevo email delivery failed" };
      }

      console.log(`✅ Email sent via Brevo HTTPS API to: ${to} (ID: ${resData.messageId})`);
      return { success: true, messageId: resData.messageId, provider: 'brevo' };
    } catch (err) {
      console.error("❌ Brevo network request error:", err.message);
      return { success: false, error: "Brevo network request failed" };
    }
  }

  // =========================================================================
  // 3. CONSOLE / SIMULATION (DEVELOPMENT ONLY)
  // =========================================================================
  if (provider === 'console' || (!process.env.EMAIL_USER && !process.env.EMAIL_PASSWORD)) {
    console.warn(`⚠️ EMAIL SIMULATION: No API credentials set. Logging message for ${to}`);
    console.log(`================ EMAIL SIMULATION ================`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log(`==================================================`);
    return { success: true, simulated: true };
  }

  // =========================================================================
  // 4. FALLBACK: SMTP (Direct IPv4 Resolution)
  // =========================================================================
  try {
    const rawHost = process.env.EMAIL_HOST || "smtp.gmail.com";
    const port = Number(process.env.EMAIL_PORT) || 465;

    let resolvedHost = rawHost;
    try {
      const ipv4 = await lookupIPv4(rawHost);
      if (ipv4) resolvedHost = ipv4;
    } catch (dnsErr) {
      // Ignore
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
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    });

    const info = await transporter.sendMail({
      from: formattedFrom,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });

    console.log(`✅ Email sent via SMTP to: ${to} (ID: ${info.messageId})`);
    return { success: true, info };
  } catch (error) {
    console.error("❌ SMTP Error:", error.message);
    return { success: false, error: "SMTP email delivery failed" };
  }
};

export default sendEmail;