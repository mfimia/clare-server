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
// @access  Private
router.get("/", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      const users = await db.collection("users").find().toArray();
      res.json(users);
      await client.close();
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users
// desc     Get all email addresses
// @access  Private
router.get("/email", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      const emails = await db.collection("users").distinct("email");
      res.json(emails);
      await client.close();
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/users
// desc     Add new user
// @access  Private
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
          await client.close();
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
      res.json(newUser);
      await client.close();
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/users/referrals
// desc     Get user with most referrals
// @access  Private
router.get("/referrals", async (req, res) => {
  try {
    client.connect(async () => {
      const db = client.db("Clare");
      // returns document with largest "given_referrals" array
      const mostReferrals = await db
        .collection("users")
        .find()
        .sort("given_referrals", -1)
        // in case there is a draw, we get oldest user
        .sort("created_at", 1)
        .limit(1)
        .toArray();

      // returns an object with user and amount of referrals
      res.json({
        user: mostReferrals[0],
        refAmount: mostReferrals[0].given_referrals.length,
      });
      await client.close();
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
