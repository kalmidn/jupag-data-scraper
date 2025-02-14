import axios from "axios";
import fs from "fs";
import express from "express";
import { Request, Response } from "express";

const API_URL = "https://worker.jup.ag/doves-oracle/btcusd,ethusd,solusd,usdcusd,usdtusd"; // Replace with actual API URL
const INTERVAL_MS = 5000; // Fetch data every 5 seconds
const DATA_FILE = "data.json";

// Initialize Express app
const app = express();

// Function to convert UNIX timestamp to human-readable format
const formatTimestamp = (unixTs: number): string => {
  return new Date(unixTs * 1000).toISOString().replace("T", " ").slice(0, 19);
};

// Function to fetch and process data
const fetchData = async () => {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (Array.isArray(data)) {
      const formattedData = data.map((entry) => {
        if (entry.feedId && entry.price && entry.expo !== undefined) {
          return {
            feedId: entry.feedId,
            price: entry.price * 10 ** entry.expo, // Convert price
            timestamp: entry.ts,
            dateTimeUTC: formatTimestamp(entry.ts) // Human-readable format
          };
        }
      }).filter(Boolean); // Remove undefined entries

      console.log("📡 New Data:", formattedData);

      // Save formatted data to JSON file (overwrite)
      fs.writeFileSync(DATA_FILE, JSON.stringify(formattedData, null, 2));
    } else {
      console.error("❌ Unexpected response format:", data);
    }
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  }
};

// Start fetching data immediately, then repeat at intervals
console.log(`🚀 Starting scraper... Fetching data every ${INTERVAL_MS / 1000} seconds.`);
fetchData();
setInterval(fetchData, INTERVAL_MS);

// API Endpoint to serve data
app.get("/data", (req: Request, res: Response) => {
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    res.send(`<pre>${data}</pre>`);
  } else {
    res.status(404).send("❌ No data available.");
  }
});

// Start Express server
const PORT = 3000;
app.listen(PORT, () => console.log(`🌍 Server running on http://localhost:${PORT}/data`));
