const express = require("express");
const authMiddleware = require("../middleware/auth");
const ProfileModel = require("../models/Profile");

const router = express.Router();

// @Route  : GET /me
// @Desc   : Get the profile of logged in user
// @Access : Private
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await ProfileModel.findOne({
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

module.exports = router;
