const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// add environment variables
dotenv.config();

// connect db
connectDB();

const app = express();

// enable cors
app.use(cors());

// parse JSON with middleware
app.use(express.json({ extended: false }));

// users route
app.use("/api/users", require("./routes/users"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
