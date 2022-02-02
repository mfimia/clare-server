const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please enter a valid email format",
    ],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  referral_code: {
    type: String,
    required: true,
    unique: true,
    match: [/[A-Za-z0-9]/],
  },
  given_referrals: [String],
  referred_by: String,
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
