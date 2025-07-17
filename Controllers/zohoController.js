const axios = require("axios");
const getZohoAccessToken = require("../Middlewares/zohoAuth");

exports.sendLeadToZoho = async (req, res) => {
  const { name, email, phone, company, services, message } = req.body;

  try {
    const accessToken = await getZohoAccessToken();

    const response = await axios.post(
      "https://www.zohoapis.in/crm/v2/Leads",
      {
        data: [
          {
            Last_Name: name || "Unknown",
            Email: email,
            Phone: phone,
            Company: company || "Landing Page",
            Description: message || "",
            Lead_Source: services || "Website"
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    console.error("Zoho Lead Sync Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to sync lead to Zoho" });
  }
};
