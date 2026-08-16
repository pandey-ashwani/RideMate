// Email Service supporting Resend, Brevo, Nodemailer, and Dev Console

export const sendEmail = async ({ to, subject, text, html }) => {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  const isProduction = process.env.NODE_ENV === 'production';
  const fromEmail = process.env.EMAIL_FROM || 'support@ridemate.com';

  if (provider === 'console') {
    if (isProduction) {
      console.error('[EMAIL ERROR] EMAIL_PROVIDER=console is forbidden in production!');
      return { success: false, error: 'Console provider forbidden in production' };
    }
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject} | Text: ${text}`);
    return { success: true, provider: 'console' };
  }

  try {
    if (provider === 'resend') {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error('Missing RESEND_API_KEY configuration');

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          text,
          html: html || `<p>${text}</p>`
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Resend API error');
      }
      return { success: true, provider: 'resend', resData };
    }

    if (provider === 'brevo') {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey) throw new Error('Missing BREVO_API_KEY configuration');

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: fromEmail, name: 'RideMate' },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html || `<p>${text}</p>`
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Brevo API error');
      }
      return { success: true, provider: 'brevo', resData };
    }

    throw new Error(`Unsupported EMAIL_PROVIDER '${provider}'`);
  } catch (err) {
    console.error(`[Email Delivery Failed - ${provider}]:`, err.message);
    return { success: false, provider, error: err.message };
  }
};

export default sendEmail;
