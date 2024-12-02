/*
HOW TO SETUP:
1. Replace YOUR_SERVER_ID with your server id. Find this at the epicnodes.com in Compute > My Servers > Manage and the URL will have a server id, in the format XXXXXXXX (or 8 characters).
2. Replace YOUR_COOKIE_HERE with your cookie. To find this, go to your server and right click and click inspect, then click Network and refresh, and find the websocket and scroll down on the headers to find your cookie.
3. npm install axios
4. node index.js (rename index.js to your javascript file)

Notes:
- If it says 400 error code, this means that the renew is not needed yet.
- If it says 200, it means the server has been renewed.
- If it says 429, you might have set the setinterval to something to check fast.
- If it says 403/401, it means you are missing your cookie or your server id.
- For this to work, the node which your server is running on must be running, otherwise it will fail.
*/

const axios = require('axios');

const RENEW_URL = 'https://epicnodes.com/api/server/YOUR_SERVER_ID/renewal/renew'; // Replace YOUR_SERVER_ID with your server id. e.g. 3f2a4d8c
const COOKIE = 'YOUR_COOKIE_HERE'; // Replace with your cookie.

const checkAndRenew = async () => {
  try {
    const renewResponse = await axios.post(RENEW_URL, {}, {
      headers: {
        'Cookie': COOKIE,
      },
    });

    console.log('Response Data:', renewResponse.data);

    if (renewResponse.status === 200) {
      console.log('✅ Server renewed successfully:', renewResponse.data);
    } else {
      console.log('⚠️ Renewal failed or not needed:', renewResponse.status, renewResponse.data);
    }
  } catch (error) {
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
};

checkAndRenew(); // This checks instantly, then it checks every minute for renews.
setInterval(checkAndRenew, 60 * 1000);
