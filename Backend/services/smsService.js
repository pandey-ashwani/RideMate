// SMS Service supporting MSG91, Twilio, Exotel, and Dev Console

export const sendSMS = async (toPhone, text) => {
  const provider = process.env.SMS_PROVIDER || 'console';
  const isProduction = process.env.NODE_ENV === 'production';

  if (provider === 'console') {
    if (isProduction) {
      console.error('[SMS ERROR] SMS_PROVIDER=console is forbidden in production!');
      return { success: false, error: 'Console provider forbidden in production' };
    }
    console.log(`[DEV SMS] To: ${toPhone} | Message: ${text}`);
    return { success: true, provider: 'console' };
  }

  try {
    if (provider === 'msg91') {
      const authKey = process.env.MSG91_AUTH_KEY;
      const senderId = process.env.MSG91_SENDER_ID;
      const templateId = process.env.MSG91_TEMPLATE_ID;

      if (!authKey || !senderId) {
        throw new Error('Missing MSG91 configuration credentials');
      }

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
      return { success: true, provider: 'msg91', resData };
    }

    if (provider === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromPhone) {
        throw new Error('Missing Twilio configuration credentials');
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
      return { success: true, provider: 'twilio', resData };
    }

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
      return { success: true, provider: 'exotel', resData };
    }

    throw new Error(`Unsupported SMS_PROVIDER '${provider}'`);
  } catch (err) {
    console.error(`[SMS Delivery Failed - ${provider}]:`, err.message);
    return { success: false, provider, error: err.message };
  }
};

export default sendSMS;
