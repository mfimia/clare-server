const { MongoClient } = require("mongodb");
const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const genReferral = require("../utils/genReferral");

// use environment variables
dotenv.config();

// connect to db
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// @route   GET api/users
// desc     Get all users
router.get("/", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      const users = await db.collection("users").find().toArray();
      res.json(users);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users
// desc     Get all email addresses
router.get("/email", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      // const emails = await db.collection("users").distinct("email");
      const emails = await db
        .collection("users")
        .aggregate([
          { $sort: { created_at: -1 } },
          // { $group: { _id: null, primaries: { $addToSet: "$email" } } },
          { $project: { email: 1, _id: 0 } },
        ])
        .toArray();

      res.json(emails);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/users/auth/code
// desc     Validate referral code
router.post("/auth/code", async (req, res) => {
  const { referred_by } = await req.body;

  try {
    client.connect(async () => {
      const db = client.db("Clare");
      const refCodes = await db.collection("users").distinct("referral_code");

      if (refCodes.includes(referred_by)) {
        res.status(200).json({ success: true });
      } else {
        res
          .status(401)
          .json({ success: false, reason: "referral code not found" });
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/users/auth/email
// desc     Check if email is in use
router.post("/auth/email", async (req, res) => {
  const { email } = await req.body;

  try {
    client.connect(async () => {
      const db = client.db("Clare");
      const emails = await db.collection("users").distinct("email");

      if (emails.includes(email)) {
        res
          .status(401)
          .json({ success: false, reason: "email already exists" });
      } else {
        res.status(200).json({ success: true });
      }
    });
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
      try {
        const filter = { referral_code: referred_by };
        const update = { $push: { given_referrals: email } };

        client.connect(async () => {
          const db = client.db("Clare");
          await db.collection("users").findOneAndUpdate(filter, update);
        });
      } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
      }
    }

    // generate new user
    const newUser = {
      first_name,
      last_name,
      email,
      referred_by: referred_by ? referred_by : null,
      created_at: new Date(),
      referral_code: genReferral(),
      given_referrals: [],
    };

    // add user to collection
    client.connect(async () => {
      const db = client.db("Clare");
      await db.collection("users").insertOne(newUser);
      res.status(200).json(newUser);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users/referrals
// desc     Get user with most referrals
router.get("/referrals", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      // returns document with largest "given_referrals" array
      const mostReferrals = await db
        .collection("users")
        .aggregate([
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
        ])
        .toArray();

      res.json(mostReferrals[0]);
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
