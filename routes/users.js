const express = require("express");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");

const router = express.Router();
const Users = require("../models/User");

// @route  : POST '/api/users/'
// @desc   : User registration
// @access : Public
router.post(
  "/",
  [
    check("name", "Name cannot be blank")
      .not()
      .isEmpty(),
    check("email", "Email should be valid").isEmail(),
    check("password", "Password should be more than 6 characters").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    try {
      const { name, email, password, avatar } = req.body;
      let user = await Users.findOne({ email });

      if (user) {
        return res.status(400).json({
          errors: [{ msg: "User already exists" }]
        });
      }

      user = new Users({
        name,
        email,
        password,
        avatar
      });

      user.avatar = gravatar.url(email, {
        s: 200,
        r: "g",
        d: "mp"
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      res.send("User registered.");
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Internal server error");
    }
  }
);

module.exports = router;
