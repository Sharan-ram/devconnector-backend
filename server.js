require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/db");

const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

app.use(express.json());

// Connect to MongoDB
dbConnect();

app.get("/", (req, res) => res.send("The app has started."));

// User routes
app.use("/api/users", userRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Profile routes
app.use("/api/profile", profileRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
