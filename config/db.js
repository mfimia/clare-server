const mongoose = require("mongoose");
const dotenv = require("dotenv");

// use environment variables
dotenv.config();

// 2. connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("db connected");
  } catch (err) {
    console.error(err.message);

    process.exit(1);
  }
};

module.exports = connectDB;
