const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/auth");

const User = require("../models/User");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json({ user });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error.");
  }
});

module.exports = router;
