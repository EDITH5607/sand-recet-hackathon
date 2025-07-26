import express from "express";
import cors from "cors";
import getYoutubeTranscript from "./getTranscript.js";
import fs from "fs/promises";

const app = express();
app.use(cors());
app.use(express.json());
/////////
async function logPauseEvent({ videoId, pauseTime, interval, position }) {
	
	const formattedPosition = (Math.round(position * 100) / 100).toFixed(2);
	const logEntry = {
		timestamp: new Date().toISOString(),
		videoId,
		pauseTime,
		interval,
		position: formattedPosition,
		type: "AUTO_PAUSE",
	};

	const logString = JSON.stringify(logEntry) + ",\n";

	try {
		await fs.appendFile("pause-events.log", logString);
		console.log("Pause event logged:", logEntry);
	} catch (error) {
		console.error("Error logging pause event:", error);
	}
}

// Add new endpoint for pause events
app.post("/api/pause-event", async (req, res) => {
	const { videoId, pauseTime, interval, position } = req.body;

	if (!videoId || !pauseTime || !interval || position === undefined) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	try {
		await logPauseEvent({ videoId, pauseTime, interval, position });
		res.json({ message: "Pause event recorded" });
	} catch (error) {
		console.error("Pause event error:", error);
		res.status(500).json({ error: "Failed to record pause event" });
	}
});
/////////

app.post("/api/transcript", async (req, res) => {
	const { videoId } = req.body;
	console.log("Received videoId on server:", videoId);
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

// Add to server.js
app.get("/api/questions", async (req, res) => {
	try {
		const data = await fs.readFile("result.json", "utf-8");
		res.json(JSON.parse(data));
	} catch (err) {
		res.status(500).json({ error: "Could not read questions file." });
	}
});

// Express.js
app.get("/api/questions", (req, res) => {
	const videoId = req.query.videoId;
	const filePath = path.join(__dirname, "results", `${videoId}.json`);

	if (!videoId) return res.status(400).json({ error: "Missing videoId" });

	fs.readFile(filePath, "utf8", (err, data) => {
		if (err) return res.status(404).json({ error: "Result not found" });
		try {
			const result = JSON.parse(data);
			res.json({ questions: result.questions || [] });
		} catch (parseErr) {
			res.status(500).json({ error: "Malformed result.json" });
		}
	});
});

app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});