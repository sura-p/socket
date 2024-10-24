// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const multer = require('multer');
const upload  = require("../utils");
const validate_user = require("../middleware/auth");
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
router.put('/update-profile',validate_user.validate_user, upload.single('file') ,async (req,res)=>{
  try {
    let updated
    if(req.file){
      
      req.body.image = req.file.filename
      console.log(req.body);
      updated = await User.findOneAndUpdate(
        { _id: req.userId },
        { $set: { ...req.body } },
        { new: true }
      );
      
      console.log("query");
      
    }else{
      console.log("query123");
       updated  = await User.findOneAndUpdate({_id:req.userId},req.body,{new:true})
    }
    return res.status(200).json({message:'profile updated',data:updated})
  } catch (error) {
    res.status(500).json({message:"Oops, something went wrong"})
  }
    })

router.get('/get-profile', validate_user.validate_user,async (req,res)=>{
  try {
    const user = await User.findById({_id:req.userId})
    delete user.password
    return res.status(200).json({message:'profile fetched',data:user})
  } catch (error) {
    res.status(500).json({message:"Oops, something went wrong"})
  }
})

module.exports = router;
