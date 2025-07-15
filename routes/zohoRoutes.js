const express = require("express");
const router = express.Router();
const { sendLeadToZoho } = require("../Controllers/zohoController");

router.post("/send-lead", sendLeadToZoho);

module.exports = router;
