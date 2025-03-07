const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*", methods: ["POST", "GET"], allowedHeaders: ["Content-Type"] }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const db = mongoose.connection;

// Define Schema
const MaddenDataSchema = new mongoose.Schema({
    data: Object, // Stores the JSON data from Madden
    meta: {        // Stores metadata for filtering
        fullPath: String, // Full URL path sent by Madden (for reference)
    },
    timestamp: { type: Date, default: Date.now },
});

const MaddenData = mongoose.model("MaddenData", MaddenDataSchema);

// ✅ Root Route - Confirms API is Running
app.get("/", (req, res) => {
    res.send("Madden API is running! Available endpoints: /upload, /data");
});

// ✅ Handle ALL Madden Companion App Export URLs
app.post("/upload/*", async (req, res) => {
    try {
        const fullPath = req.path.replace("/upload/", ""); // Capture full dynamic URL
        console.log(`📥 Received export request: ${fullPath}`);

        if (!req.body || Object.keys(req.body).length === 0) {
            console.warn("⚠️ Received empty request body!");
            return res.status(400).json({ message: "Empty request body received." });
        }

        const newEntry = new MaddenData({
            data: req.body,
            meta: { fullPath }, // Store the full export path for debugging
        });

        await newEntry.save();
        console.log(`✅ Data successfully saved for: ${fullPath}`);

        res.status(200).json({ message: "Data saved successfully!" });
    } catch (error) {
        console.error("❌ Error saving data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ Retrieve Latest Madden Export Data
app.get("/data", async (req, res) => {
    try {
        const latestData = await MaddenData.find().sort({ timestamp: -1 }).limit(1);
        res.status(200).json(latestData[0] || { message: "No data found." });
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
