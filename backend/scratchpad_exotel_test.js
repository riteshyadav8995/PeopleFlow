require('dotenv').config();

async function testExotel() {
  const exotelApiKey = process.env.EXOTEL_API_KEY;
  const exotelApiToken = process.env.EXOTEL_API_TOKEN;
  const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
  const exotelVirtualNumber = '08000000000'; // Intentional dummy number to see error
  const to = '09876543210'; // dummy target
  const webhookUrl = 'https://people-flow-rose.vercel.app/api/v1/voice-agent/exotel/webhook';

  const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString('base64');
  const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelAccountSid}/Calls/connect.json`;

  const formData = new URLSearchParams();
  formData.append('From', exotelVirtualNumber);
  formData.append('To', to);
  formData.append('Url', webhookUrl);

  try {
    const res = await fetch(exotelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });
    
    const body = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err);
  }
}

testExotel();
