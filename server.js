require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/db");

const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const postRoutes = require("./routes/post");

const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
dbConnect();

app.get("/", (req, res) => res.send("The app has started."));

// User routes
app.use("/api/users", userRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Profile routes
app.use("/api/profile", profileRoutes);

// Posts routes
app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
