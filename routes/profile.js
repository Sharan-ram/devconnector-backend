const express = require("express");
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const Profile = require("../models/Profile");

const router = express.Router();

// @Route  : GET /me
// @Desc   : Get the profile of logged in user
// @Access : Private
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.json({
        errors: [
          {
            msg: "The profile does not exist"
          }
        ]
      });
    }

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Internal Server Error");
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
      check("status", "Status is required")
        .not()
        .isEmpty(),
      check("skills", "Skills is required")
        .not()
        .isEmpty()
    ]
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
      experience = [],
      education = [],
      social = {}
    } = req.body;

    const profileFields = {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      experience,
      education,
      social
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

module.exports = router;
