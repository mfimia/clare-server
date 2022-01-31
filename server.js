const express = require("express");
const dotenv = require("dotenv");

// add environment variables
dotenv.config();

const app = express();

// parse JSON with middleware
app.use(express.json({ extended: false }));

// users route
app.use("/api/users", require("./routes/users"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
