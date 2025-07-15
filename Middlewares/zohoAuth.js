const axios = require("axios");
require("dotenv").config();

let accessTokenCache = null;
let tokenExpiryTime = 0;

const getZohoAccessToken = async () => {
  const currentTime = Math.floor(Date.now() / 1000);
  if (accessTokenCache && currentTime < tokenExpiryTime - 60) {
    return accessTokenCache;
  }

  const res = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }
  });

  accessTokenCache = res.data.access_token;
  tokenExpiryTime = currentTime + res.data.expires_in;
  return accessTokenCache;
};

module.exports = getZohoAccessToken;
