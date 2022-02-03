const express = require("express");
const router = express.Router();

const {
  addUser,
  getEmails,
  getUsers,
  getReferrals,
} = require("../controllers/users");

router.get("/", getUsers);
router.get("/email", getEmails);
router.get("/referrals", getReferrals);
router.post("/", addUser);

module.exports = router;
