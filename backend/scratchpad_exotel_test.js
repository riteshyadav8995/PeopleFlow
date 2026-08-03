require('dotenv').config();

async function testExotelCall() {
  const exotelApiKey = process.env.EXOTEL_API_KEY;
  const exotelApiToken = process.env.EXOTEL_API_TOKEN;
  const exotelAccountSid = process.env.EXOTEL_ACCOUNT_SID;
  const exotelVirtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER;
  const backendUrl = process.env.BACKEND_URL;

  console.log('=== Exotel Debug Test ===');
  console.log('EXOTEL_API_KEY:', exotelApiKey ? '✅ Set' : '❌ Missing');
  console.log('EXOTEL_API_TOKEN:', exotelApiToken ? '✅ Set' : '❌ Missing');
  console.log('EXOTEL_ACCOUNT_SID:', exotelAccountSid || '❌ Missing');
  console.log('EXOTEL_VIRTUAL_NUMBER:', exotelVirtualNumber || '❌ Missing');
  console.log('BACKEND_URL:', backendUrl || '❌ Missing');

  // Test the webhook URL is accessible
  if (backendUrl) {
    console.log('\n--- Testing webhook URL ---');
    const webhookUrl = `${backendUrl}/api/v1/voice-agent/exotel/webhook?callLogId=test`;
    console.log('Webhook URL:', webhookUrl);
    
    try {
      const res = await fetch(webhookUrl, { method: 'POST' });
      const body = await res.text();
      console.log('Webhook status:', res.status, body ? body.substring(0, 200) : 'empty');
    } catch (err) {
      console.log('Webhook reachable?', '❌ Cannot reach:', err.message);
    }
  }

  // Test Exotel API - USE YOUR VERIFIED CO-WORKER NUMBER HERE
  const testPhoneNumber = '+919798800286'; // Change this to the verified number
  
  console.log('\n--- Testing Exotel API Call ---');
  console.log('Calling:', testPhoneNumber);
  
  const authHeader = Buffer.from(`${exotelApiKey}:${exotelApiToken}`).toString('base64');
  const exotelUrl = `https://api.exotel.com/v1/Accounts/${exotelAccountSid}/Calls/connect.json`;
  const webhookUrl = `${backendUrl}/api/v1/voice-agent/exotel/webhook?callLogId=debug-test`;

  const formData = new URLSearchParams();
  formData.append('From', exotelVirtualNumber);
  formData.append('To', testPhoneNumber);
  formData.append('Url', webhookUrl);
  formData.append('TimeLimit', '60'); // 60 second call limit for test
  formData.append('StatusCallback', `${backendUrl}/api/v1/voice-agent/exotel/webhook`);

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
    console.log('\nExotel API Status:', res.status);
    console.log('Exotel API Response:', body);
    
    if (res.status === 200 || res.status === 201) {
      console.log('\n✅ SUCCESS! Call initiated!');
    } else if (res.status === 403) {
      console.log('\n❌ KYC Error - Account not verified for outbound calls');
    } else if (res.status === 401) {
      console.log('\n❌ Authentication Error - Check API Key and Token');
    }
  } catch (err) {
    console.log('❌ Network Error:', err.message);
  }
}

testExotelCall();
