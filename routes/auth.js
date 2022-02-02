const express = require("express");
const router = express.Router();

// get model
const User = require("../models/User");

// @route   POST api/users/auth/code
// desc     Validate referral code
router.post("/code", async (req, res) => {
  const { referred_by } = await req.body;

  try {
    const refCodes = await User.distinct("referral_code");

    if (refCodes.includes(referred_by)) {
      res.status(200).json({ success: true });
    } else {
      res
        .status(401)
        .json({ success: false, reason: "referral code not found" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/users/auth/email
// desc     Check if email is in use
router.post("/email", async (req, res) => {
  const { email } = await req.body;

  try {
    const emails = await User.distinct("email");

    if (emails.includes(email)) {
      res.status(401).json({ success: false, reason: "email already exists" });
    } else {
      res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
