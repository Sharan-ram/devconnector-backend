const express = require("express");
const dbConnect = require("./config/db");

const app = express();

// Connect to MongoDB
dbConnect();

app.get("/", (req, res) => res.send("The app has started."));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
