// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const router = express.Router();

// JWT Secret
const JWT_SECRET = "your_jwt_secret";

// Register User
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    
    res.status(400).json({ error: "User registration failed" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ token,firstName:user.username,image:'https://dummyjson.com/icon/emilys/128',id:user._id });
  } catch (err) {
    console.log(err);
    
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
