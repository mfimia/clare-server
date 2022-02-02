const express = require("express");
const router = express.Router();
const genReferral = require("../utils/genReferral");

// get model
const User = require("../models/User");

// @route   GET api/users
// desc     Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users
// desc     Get all email addresses
router.get("/email", async (req, res) => {
  try {
    const emails = await User.aggregate([
      { $sort: { created_at: -1 } },
      { $project: { email: 1, _id: 0 } },
    ]);

    res.json(emails);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/users
// desc     Add new user
router.post("/", async (req, res) => {
  try {
    const { first_name, last_name, email, referred_by } = await req.body;

    // if user has been referred, update source user
    if (referred_by) {
      const filter = { referral_code: referred_by };
      const update = { $push: { given_referrals: email } };

      await User.findOneAndUpdate(filter, update);
    }

    // generate new user
    const newUser = new User({
      first_name,
      last_name,
      email,
      referred_by: referred_by ? referred_by : null,
      created_at: new Date(),
      referral_code: genReferral(),
      given_referrals: [],
    });

    // add user to collection
    await newUser.save();

    res.status(200).json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users/referrals
// desc     Get user with most referrals
router.get("/referrals", async (req, res) => {
  try {
    // returns document with largest "given_referrals" array
    const mostReferrals = await User.aggregate([
      { $unwind: "$given_referrals" },
      {
        $group: {
          _id: "$_id",
          length: { $sum: 1 },
          email: { $first: "$email" },
          first_name: { $first: "$first_name" },
          last_name: { $first: "$last_name" },
          created_at: { $first: "$created_at" },
        },
      },
      // sort by array length, then by "oldest" user
      { $sort: { length: -1, created_at: 1 } },
      { $limit: 1 },
    ]);

    res.json(mostReferrals[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
