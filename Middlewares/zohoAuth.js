const axios = require("axios");
require("dotenv").config();

let accessTokenCache = null;
let tokenExpiryTime = 0;

const getZohoAccessToken = async () => {
  const currentTime = Math.floor(Date.now() / 1000);

  // ✅ Use cached token if still valid
  if (accessTokenCache && currentTime < tokenExpiryTime - 60) {
    console.log("✅ Using cached Zoho access token");
    return accessTokenCache;
  }

  try {
    const tokenUrl = "https://accounts.zoho.in/oauth/v2/token";

    const response = await axios.post(tokenUrl, null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // ✅ Only this is needed
      },
    });

    const { access_token, expires_in } = response.data;

    // ⏳ Update cache
    accessTokenCache = access_token;
    tokenExpiryTime = currentTime + expires_in;

    console.log("🔐 New Zoho access token generated:", access_token);
    return access_token;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("❌ Zoho Access Token Fetch Error:", errData);
    throw new Error("Failed to get Zoho access token");
  }
};

module.exports = getZohoAccessToken;
