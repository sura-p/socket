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
  try {
   await User.findByIdAndUpdate({_id:new Types.ObjectId(req.userId)}, { $push: { contacts: req.body.email } },{new:true})
    
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
    $match: { matchedUsers: { $ne: null } } // Filter out documents where matchedUsers is null
  },
  {
    $replaceRoot: { newRoot: '$matchedUsers' } // Replace root with the matched user
  }
]);
    
    return res.json({contacts: user });
  } catch (err) {
    console.log(err);
    
    return res.status(500).json({ error: "user contact list failed" });
  }
});


router.get('/search-peer',async (req,res)=>{
  const currentUser = await User.findById(req.userId).select('email contacts');
console.log(currentUser);

  const peers = await User.aggregate([
    {
      $match: {
        $or: [
          { email: { $regex: req.query.search, $options: "i" } },
          { username: { $regex: req.query.search, $options: "i" } }
        ],
      
        email: { 
          $nin: [...currentUser.contacts, currentUser.email] 
        }
      }
    },
    {
      $addFields:{
        connected:false
      }
    },
    {
      $project: {
        _id: 1,
        email: 1,
        username: 1,
        image: 1,
        connected:"$connected"
      }
    }
  ]);

  return res.status(200).json({peer:peers})
})

module.exports = router;
