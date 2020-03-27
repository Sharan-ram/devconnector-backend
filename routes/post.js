const express = require("express");
const { check, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth");
const Post = require("../models/Post");
const User = require("../models/User");

const router = express.Router();

// @Route:   GET /all
// @desc:    Get all posts
// @Access:  Private
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// @Route:   GET /
// @desc:    Get all posts of the logged in user
// @Access:  Private
router.get("/", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Internal Server Error");
  }
});

// @Route:   GET /:id
// @desc:    Get post by post id
// @Access:  Private
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Internal Server Error");
  }
});

// @Route:   PUT /:id/like
// @desc:    Like a post
// @Access:  Private
router.put("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }

    const like = post.likes.find(
      like => like.user.toString() === req.body.user.toString()
    );
    if (!like) {
      post.likes.push({ user: req.body.user });
      post.save();
      return res.json(post.likes);
    }
    res.send("Post has already been liked");
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Internal Server Error");
  }
});

// @Route:   POST /
// @desc:    Create a new post
// @Access:  Private
router.post(
  "/",
  [
    authMiddleware,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// @Route:   DELETE /:id
// @desc:    Delete post
// @Access:  Private
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }

    if (post.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ errors: [{ msg: "Post cannot be deleted" }] });
    }

    await post.remove();
    res.send("Post deleted");
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ errors: [{ msg: "Post not found" }] });
    }
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
