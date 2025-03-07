const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once("open", () => console.log("Connected to MongoDB"));

// Define Schema
const MaddenDataSchema = new mongoose.Schema({
    data: Object, // Store entire JSON
    timestamp: { type: Date, default: Date.now },
});

const MaddenData = mongoose.model("MaddenData", MaddenDataSchema);

// Endpoint to receive Madden data
app.post("/upload", async (req, res) => {
    try {
        const newEntry = new MaddenData({ data: req.body });
        await newEntry.save();
        res.status(200).json({ message: "Data saved successfully!" });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Endpoint to fetch the latest data
app.get("/data", async (req, res) => {
    try {
        const latestData = await MaddenData.find().sort({ timestamp: -1 }).limit(1);
        res.status(200).json(latestData[0]);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
