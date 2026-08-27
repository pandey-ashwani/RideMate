// SMS Service supporting Twilio, Fast2SMS, MSG91, Exotel, and Dev Console

export const sendSMS = async (toPhone, text) => {
  let provider = process.env.SMS_PROVIDER;
  const isProduction = process.env.NODE_ENV === 'production';

  // Auto-detect provider if not explicitly configured
  if (!provider) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      provider = 'twilio';
    } else if (process.env.FAST2SMS_API_KEY) {
      provider = 'fast2sms';
    } else if (process.env.MSG91_AUTH_KEY) {
      provider = 'msg91';
    } else if (process.env.EXOTEL_ACCOUNT_SID) {
      provider = 'exotel';
    } else {
      provider = 'console';
    }
  }

  if (provider === 'console') {
    if (isProduction) {
      console.error('[SMS ERROR] SMS_PROVIDER=console is forbidden in production!');
      return { success: false, error: 'Console provider forbidden in production' };
    }
    console.log(`[SMS LOG] To: ${toPhone} | Message: ${text}`);
    return { success: true, provider: 'console' };
  }

  try {
    // 1. Fast2SMS Provider (India Quick OTP)
    if (provider === 'fast2sms') {
      const apiKey = process.env.FAST2SMS_API_KEY;
      if (!apiKey) throw new Error('Missing FAST2SMS_API_KEY configuration');

      // Extract raw 10 digit number
      const cleanNumber = toPhone.replace('+91', '').replace(/\D/g, '');

      // Extract OTP digits from message text
      const otpMatch = text.match(/\b\d{6}\b/);
      const otpCode = otpMatch ? otpMatch[0] : text;

      const response = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otpCode}&numbers=${cleanNumber}`, {
        method: 'GET'
      });

      const resData = await response.json();
      if (!response.ok || resData.return === false) {
        throw new Error(resData.message || 'Fast2SMS API error');
      }
      console.log(`[SMS SUCCESS] Sent via Fast2SMS to ${toPhone}`);
      return { success: true, provider: 'fast2sms', resData };
    }

    // 2. Twilio Provider
    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
        throw new Error('Missing Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)');
      }

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', toPhone);
      params.append('From', fromPhone);
      params.append('Body', text);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Twilio API error');
      }
      console.log(`[SMS SUCCESS] Sent via Twilio to ${toPhone}`);
      return { success: true, provider: 'twilio', resData };
    }

    // 3. MSG91 Provider
    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;
      const senderId = process.env.MSG91_SENDER_ID || 'RIDEMT';
      const templateId = process.env.MSG91_TEMPLATE_ID;

      if (!authKey) throw new Error('Missing MSG91_AUTH_KEY credentials');

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify({
          template_id: templateId,
          sender: senderId,
          recipients: [{ mobiles: toPhone.replace('+', ''), message: text }]
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'MSG91 API error');
      }
      console.log(`[SMS SUCCESS] Sent via MSG91 to ${toPhone}`);
      return { success: true, provider: 'msg91', resData };
    }

    // 4. Exotel Provider
    if (provider === 'exotel') {
      const accountSid = process.env.EXOTEL_ACCOUNT_SID;
      const apiKey = process.env.EXOTEL_API_KEY;
      const apiToken = process.env.EXOTEL_API_TOKEN;

      if (!accountSid || !apiKey || !apiToken) {
        throw new Error('Missing Exotel configuration credentials');
      }

      const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', process.env.EXOTEL_SENDER_ID || 'RideMate');
      params.append('To', toPhone);
      params.append('Body', text);

      const response = await fetch(`https://api.exotel.com/v1/Accounts/${accountSid}/Sms/send.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.RestException?.Message || 'Exotel API error');
      }
      console.log(`[SMS SUCCESS] Sent via Exotel to ${toPhone}`);
      return { success: true, provider: 'exotel', resData };
    }

    throw new Error(`Unsupported SMS_PROVIDER '${provider}'`);
  } catch (err) {
    console.error(`[SMS Delivery Failed - ${provider}]:`, err.message);
    return { success: false, provider, error: err.message };
  }
};

export default sendSMS;
