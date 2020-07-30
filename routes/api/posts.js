const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  "/",
  [auth, [check("text", "Text is required").not().isEmpty()]],
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
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.meesage);
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   GET api/posts/:post_id
// @desc    Get post by ID
// @access  Private
router.get("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error(error.meesage);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete post by ID
// @access  Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    //object & string
    if (post.user.toString() !== req.user.id) {
      console.log("Current User: " + req.user.id + " " + req.user.name);
      console.log(
        "Post User: " + post.user.toString() + " " + post.name.toString()
      );
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.remove();

    res.json({ msg: "Post Removed" });
  } catch (error) {
    console.error(error.meesage);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   PUT api/posts/:post_id/like
// @desc    Like a post
// @access  Private
router.put("/:post_id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    //Check if already liked by this user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   PUT api/posts/:post_id/unlike
// @desc    Unlike a post
// @access  Private
router.put("/:post_id/unlike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    //Check if not yet liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   POST api/posts/:post_id/comments/
// @desc    Create a comment on a post
// @access  Private
router.post(
  "/:post_id/comments",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");

      const post = await Post.findById(req.params.post_id);

      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   GET api/posts/:post_id/comments
// @desc    Get all comments on a post
// @access  Private
router.get("/:post_id/comments", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.json(post.comments);
  } catch (error) {
    console.error(error.meesage);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   GET api/posts/:post_id/comments/:comment_id
// @desc    Get a specific comments on a post
// @access  Private
router.get("/:post_id/comments/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(
      post.comments.filter((comment) => comment.id === req.params.comment_id)
    );
  } catch (error) {
    console.error(error.meesage);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @route   DELETE api/posts/:post_id/comments/:comment_id
// @desc    Delete a comment by ID
// @access  Private
router.delete("/:post_id/comments/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //filter returns array, find returns descendants of the match
    
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    //console.log(comment.text);

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found"})
    }

    //object & string
    if (comment.user.toString() !== req.user.id) {
      console.log("Current User: " + req.user.id + " " + req.user.name);
      console.log(
        "Comment User: " + comment.user.toString() + " " + comment.name.toString()
      );
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Get remove index
    // tutorial compares this by user id, but if multiple comments were written by one user, it will delete the latest one
    const removeIndex = post.comments
      .map((comment) => comment.id.toString())
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (error) {
    console.error(error.meesage);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found" });
    }
    res.status(500).send({ msg: "Server Error" });
  }
});

// @todo updating post, comment

module.exports = router;
