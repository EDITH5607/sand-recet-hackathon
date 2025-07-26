// server.js
import express from "express";
import cors from "cors";
import getYoutubeTranscript from "./getTranscript.js"; // assuming it’s exported
import fs from "fs/promises"; // Add this import

const app = express();
app.use(cors()); // 👈 ALLOW requests from content script
app.use(express.json());
/////////
async function logPauseEvent({ videoId, pauseTime, interval }) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    videoId,
    pauseTime,
    interval,
    type: "AUTO_PAUSE"
  };
  
  const logString = JSON.stringify(logEntry) + ",\n";
  
  try {
    await fs.appendFile('pause-events.log', logString);
    console.log("Pause event logged:", logEntry);
  } catch (error) {
    console.error("Error logging pause event:", error);
  }
}

// Add new endpoint for pause events
app.post("/api/pause-event", async (req, res) => {
  const { videoId, pauseTime, interval } = req.body;
  
  if (!videoId || !pauseTime || !interval) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  try {
    await logPauseEvent({ videoId, pauseTime, interval });
    res.json({ message: "Pause event recorded" });
  } catch (error) {
    console.error("Pause event error:", error);
    res.status(500).json({ error: "Failed to record pause event" });
  }
});
/////////



app.post("/api/transcript", async (req, res) => {
	const { videoId } = req.body;
	console.log("Received videoId on server:", videoId); // <== Add this line
	if (!videoId) return res.status(400).json({ error: "No videoId provided" });

	try {
		const transcript = await getYoutubeTranscript(videoId, "en");

		const formatted = transcript
			.map(
				({ caption, startTime, endTime }) =>
					`[${startTime.toFixed(2)} - ${endTime.toFixed(2)}] ${caption}`
			)
			.join("\n");

		const fileName = `transcript.txt`;
		await fs.writeFile(fileName, formatted);

		console.log(`Transcript for ${videoId} saved as ${fileName}`);
		res.json({ message: "Transcript saved", file: fileName });
	} catch (error) {
		console.error("Transcript fetch error:", error);
		res.status(500).json({ error: error.message || "Transcript fetch failed" });
	}
});

app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});
