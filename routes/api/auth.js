const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require('../../models/User');

//pass middleware just like that
router.get("/", auth, async (req, res) => {
//   res.send("Auth route");
try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
} catch (error) {
    console.error(err.message);
    return res.status(500).send('Server Error')
}
});

module.exports = router;
