// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { Types } = require("mongoose");
const message = require("../model/message");

const router = express.Router();

// JWT Secret
const JWT_SECRET = "your_jwt_secret";

// Register User
router.get("/list", async (req, res) => {
  try {
    const peerId = req.query.peerId;
    const messages = await message.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { receiver: new Types.ObjectId(req.userId) },
                { sender: new Types.ObjectId(req.userId) }
              ]
            },
            {
              $or: [
                { receiver: new Types.ObjectId(peerId) },
                { sender: new Types.ObjectId(peerId) }
              ]
            }
          ]
        }
      },
      {
        $facet: {
          messages: [
            {
              $match: {
                $or: [
                  { receiver: new Types.ObjectId(req.userId) },
                  { sender: new Types.ObjectId(req.userId) }
                ]
              }
            },
            { $sort: { createdAt: 1 } }
          ]
        }
      }
    ]);

    return res
      .status(201)
      .json({ message: "message list fetched", data: messages });
  } catch (err) {
    console.log(err);

    return res.status(400).json({ error: "message list failed" });
  }
});

// Login User

module.exports = router;
