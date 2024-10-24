const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contacts");
const messageRoutes = require("./routes/messages");
const {validate_user} = require("./middleware/auth");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const Message = require("./model/message");
const { saveEncryptedFile, saveBufferAsImage } = require("./encryption");
const app = express();
const server = http.createServer(app);

// Setup Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "*", // Specify the front-end origin here
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  maxHttpBufferSize: 1e7
});

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL);
mongoose.set({ debug: true });
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.use("/contacts" ,validate_user, contactRoutes);
app.use("/message", validate_user, messageRoutes);



app.use("/uploads", express.static(`${__dirname}/uploads`));
app.use("/sharedMedia", express.static(`${__dirname}/ImagesShared`));
app.use("*", (req, res) => {
  return res.status(404).send({ message: "not found" });
});
// Store connected users in an array
let users = [];

// Emit user status every 2 seconds
setInterval(() => {
  for (const user of users) {
    io.emit("userStatus", { userId: user.userId, status: true });
  }
}, 2000);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  // When a user connects, associate their user ID with the socket ID
  socket.on("registerUser", (userId) => {
    console.log(userId);
    const currentTime = Date.now();

    // Check if user is already connected, update the socket ID if they are
    const existingUserIndex = users.findIndex(
      (user) => user.userId === userId.userId
    );
    if (existingUserIndex !== -1) {
      users[existingUserIndex].socketId = socket.id;
      users[existingUserIndex].lastSeen = currentTime;
    } else {
      // Add new user to the array
      users.push({
        userId: userId.userId,
        socketId: socket.id,
        lastSeen: currentTime
      });
    }

    console.log(
      `User with ID: ${userId.userId} connected with Socket ID: ${socket.id}`
    );
    io.emit("userStatus", { userId: userId.userId, status: true });
  });

  // Handle receiving a message
  socket.on("sendMessage", async (data) => {
    console.log("eventCalled");
    let newMessage;
    const { senderId, receiverId, message } = data;
    console.log(data);
   let filename =  saveBufferAsImage(data.fileUrl,data.fileName)
   if(data.fileType.startsWith('video/')){
    newMessage = await new Message({
      sender: senderId,
      receiver: receiverId,
      message,
      video:filename
    }).save();
   }else{
     newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
      image:filename
    });

    await newMessage.save();
   }
    // Save the message to the database
   

    // Find the socket ID of the receiver
    const receiver = users.find((user) => user.userId === receiverId);

    if (receiver) {
      // Emit the message to the receiver if they are connected
      io.to(receiver.socketId).emit("receiveMessage", newMessage);
      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } else {
      console.log(`User ${receiverId} is not connected`);
    }
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    // Find the user by socket ID and remove them from the `users` array
    const index = users.findIndex((user) => user.socketId === socket.id);
    if (index !== -1) {
      const disconnectedUser = users[index];
      users.splice(index, 1); // Remove user from array
      console.log(`User with ID: ${disconnectedUser.userId} disconnected`);
      io.emit("userStatus", { userId: disconnectedUser.userId, status: false });
    }
  });
});

// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
