// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { Types } = require("mongoose");

const router = express.Router();

// JWT Secret
const JWT_SECRET = "your_jwt_secret";

// Register User
router.post("/save-contact", async (req, res) => {

  const {  newContact } = req.body;
  try {
    User.findByIdAndUpdate({_id:new Types.ObjectId(req.user.id)}, { $push: { contacts: newContact } },{new:true})
    
    return res.status(201).json({ message: "contact save successfully" });
  } catch (err) {
    console.log(err);
    
    return res.status(400).json({ error: "Contact save failed" });
  }
});

// Login User
router.get("/peers/search", async (req, res) => {
  try {
    let user
    if(req.query.q!==undefined){
       user = await User.findOne({username:req.query.q});
    }
 console.log(req.userId,"userid");
 
  user = await User.aggregate([
  {
    $match: {
      _id: new Types.ObjectId(req.userId), // Match the user by their ID
    }
  },
  {
    $lookup: {
      from: 'users', // Join with the User collection
      localField: 'contacts', // Field from the first collection (current user)
      foreignField: 'email', // Field from the second collection (contacts email)
      as: 'matchedUsers' // The output array field to store matching users
    }
  },
  {
    $unwind: { // Unwind the matchedUsers array
      path: '$matchedUsers',
      preserveNullAndEmptyArrays: true // Keep the user even if there are no matches
    }
  },
  {
    $replaceRoot: { newRoot: '$matchedUsers' } // Replace root with the matched user
  }
]);
   
    if (!user) return res.status(404).json({ error: "User not found" }); 
    return res.json({contacts: user });
  } catch (err) {
    console.log(err);
    
    return res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
