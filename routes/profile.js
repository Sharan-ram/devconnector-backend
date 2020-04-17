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
      return res.send("Profile does not exist for this user");
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

//@Route   : POST /experience
//@Desc    : Add new experience
//@Access  : Private
router.post(
  "/experience",
  [
    authMiddleware,
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "Start date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).json({
          errors: [
            { msg: "Please update the profile before adding experience" },
          ],
        });
      }
      profile.experience.push(req.body);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

//@Route   : PUT /experience/:id
//@Desc    : update existing experience
//@Access  : Private
router.put(
  "/experience/:id",
  [
    authMiddleware,
    check("title", "Title is required").not().isEmpty(),
    check("company", "Company is required").not().isEmpty(),
    check("from", "Start date is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience = profile.experience.map((exp) => {
        if (exp.id === req.params.id) return req.body;
        return exp;
      });
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

//@Route   : DELETE /experience/:id
//@Desc    : Delete experience
//@Access  : Private
router.delete("/experience/:id", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const experienceIndex = profile.experience.findIndex(
      (exp) => exp.id === req.params.id
    );
    profile.experience.splice(experienceIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

//@Route   : POST /education
//@Desc    : Add new education
//@Access  : Private
router.post(
  "/education",
  [
    authMiddleware,
    check("school", "School is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
    check("from", "From date   is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(400).json({
          errors: [
            { msg: "Please update the profile before adding education" },
          ],
        });
      }
      profile.education.push(req.body);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

//@Route   : PUT /education/:id
//@Desc    : update existing education
//@Access  : Private
router.put(
  "/education/:id",
  [
    authMiddleware,
    check("school", "School is required").not().isEmpty(),
    check("degree", "Degree is required").not().isEmpty(),
    check("fieldofstudy", "Field of study is required").not().isEmpty(),
    check("from", "From date   is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education = profile.education.map((exp) => {
        if (exp.id === req.params.id) return req.body;
        return exp;
      });
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
);

//@Route   : DELETE /education/:id
//@Desc    : Delete education
//@Access  : Private
router.delete("/education/:id", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const educationIndex = profile.education.findIndex(
      (exp) => exp.id === req.params.id
    );
    profile.education.splice(educationIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

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
