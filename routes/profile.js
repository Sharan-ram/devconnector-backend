const express = require("express");
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const config = require("config");
const authMiddleware = require("../middleware/auth");
const Profile = require("../models/Profile");
const User = require("../models/User");

const router = express.Router();

// @Route  : GET /me
// @Desc   : Get the profile of logged in user
// @Access : Private
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        errors: [
          {
            msg: "The profile does not exist",
          },
        ],
      });
    }

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
  }
});

// @Route  : GET /
// @Desc   : Get all profiles
// @Access : Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// @Route  : GET /user/:user_id
// @Desc   : Get profile by userId
// @Access : Public
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ errors: [{ msg: "Profile not found" }] });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Profile not found" }] });
    }
    res.status(500).send("Internal Server Error");
  }
});

// @Route  : GET /github/:username
// @Desc   : Get user repos
// @Access : Public
router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      url: `https://api.github.com/users/${req.params.username}/repos`,
      params: {
        per_page: 5,
        sort: "created:asc",
        client_id: config.get("githubClientId"),
        client_secret: config.get("githubSecret"),
      },
      method: "GET",
      headers: {
        "user-agent": "node.js",
      },
    };

    const { data } = await axios(options);
    res.json(data);
  } catch (err) {
    console.log(err.message);
    if (err.response) {
      return res
        .status(404)
        .json({ errors: [{ msg: "Github profile not found" }] });
    }
    res.status(500).send("Internal Server Error");
  }
});

// @Route  : POST /
// @Desc   : Create/Update user profile
// Access  : Private
router.post(
  "/",
  [
    authMiddleware,
    [
      check("status", "Status is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company = "",
      website = "",
      location = "",
      status = "",
      skills = [],
      bio = "",
      githubusername = "",
      social = {},
    } = req.body;

    const profileFields = {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      social,
    };
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      // If profile already exists, then update the profile
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      // If profile doesnt exist, create a new profile
      profile = new Profile(profileFields);
      profile.user = req.user.id;
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Internal Server Error");
    }
  }
);

// @Route  : DELETE /
// @Desc   : Delete user and profile of the logged in user
// @Access : Private
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await Profile.findOneAndDelete({ user: req.user.id });
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: "Profile deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
