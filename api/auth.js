const express = require("express");
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// @desc      Get logged in user info
// @access    Private
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json({ user });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error.");
  }
});

//@desc       Login User
//@access     Public
router.post(
  "/",
  [
    check("email", "Email should be valid").isEmail(),
    check("password", "Please enter password")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    // Check if email and password fields are not empty
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(401).json({ errors: errors.array() });
    }

    try {
      // Check if a user exists with that email
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res
          .status(401)
          .json({ errors: [{ msg: "Invalud Credentials" }] });
      }
      // Check is password is correct
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ errors: [{ msg: "Invalud Credentials" }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send("Internal server error");
          }

          return res.json({
            jwt: token
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json("Internal server error");
    }
  }
);

module.exports = router;
