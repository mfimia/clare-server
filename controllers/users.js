const genReferral = require("../utils/genReferral");
const User = require("../models/User");

// Add new user
const addUser = async (req, res) => {
  const errors = [];

  try {
    const { first_name, last_name, email, referred_by } = await req.body;

    // if user has been referred, update source user
    if (referred_by) {
      const filter = { referral_code: referred_by };
      const update = { $push: { given_referrals: email } };

      const user = await User.findOneAndUpdate(filter, update);

      // if referral code is not found, add error
      if (!user) {
        errors.push({
          success: false,
          message: "Code not found",
          field: "referred_by",
          status: 404,
        });
      }
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

    try {
      // add user to collection
      await newUser.save();

      // catch errors branches
    } catch (err) {
      switch (err.code) {
        case 11000:
          errors.push({
            success: false,
            message: "Email already in use",
            field: "email",
            status: 409,
          });
          break;
        default:
          errors.push({
            success: false,
            message: "Sorry, there was a problem logging in",
            status: 500,
            field: "server",
          });
          break;
      }
    }

    // check for errors and send response
    if (!errors.length) {
      res.status(200).json(newUser);
    } else {
      res.status(400).send(errors);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// get all users
const getUsers = async (_, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// get list of emails DESC by date
const getEmails = async (_, res) => {
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
};

// get user with most referrals and # of referrals given
const getReferrals = async (_, res) => {
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
};

module.exports = {
  addUser,
  getEmails,
  getUsers,
  getReferrals,
};
