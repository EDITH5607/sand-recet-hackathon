import express from "express";
import cors from "cors";
import getYoutubeTranscript from "./getTranscript.js";
import fs from "fs/promises";
import { sendTranscriptToSupabase } from "./sendToSupabase.js";

const app = express();
app.use(cors());
app.use(express.json());
/////////
async function logPauseEvent({ videoId, interval, pauseTime }) {
	const formattedpauseTime = (Math.round(pauseTime * 100) / 100).toFixed(2);
	const logEntry = {
		videoId,
		interval,
		pauseTime: formattedpauseTime,
		type: "AUTO_PAUSE",
	};

	//const logString = JSON.stringify(logEntry) + ",\n";

	try {
		//await fs.appendFile("pause-events.log", logString);

		console.log("Pause event logged:", logEntry);

		console.log("Sending the transcript to Supabase...");
		await sendTranscriptToSupabase(pauseTime);
		console.log("Transcript sent to Supabase");

		return logEntry;
	} catch (error) {
		console.error("Error logging pause event or sending to supabase:", error);
	}
}

// Add new endpoint for pause events
app.post("/api/pause-event", async (req, res) => {
	const { videoId, interval, pauseTime } = req.body;

	if (!videoId || !interval || !pauseTime === undefined) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	try {
		const logEntry = await logPauseEvent({ videoId, interval, pauseTime });
		//res.json({ message: "Pause event recorded" });
		res.json(logEntry);
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

// // Add to server.js
// app.get("/api/questions", async (req, res) => {
// 	try {
// 		const data = await fs.readFile("result.json", "utf-8");
// 		res.json(JSON.parse(data));
// 	} catch (err) {
// 		res.status(500).json({ error: "Could not read questions file." });
// 	}
// });

// // Express.js
// app.get("/api/questions", (req, res) => {
// 	const videoId = req.query.videoId;
// 	const filePath = path.join(__dirname, "results", `${videoId}.json`);

// 	if (!videoId) return res.status(400).json({ error: "Missing videoId" });

// 	fs.readFile(filePath, "utf8", (err, data) => {
// 		if (err) return res.status(404).json({ error: "Result not found" });
// 		try {
// 			const result = JSON.parse(data);
// 			res.json({ questions: result.questions || [] });
// 		} catch (parseErr) {
// 			res.status(500).json({ error: "Malformed result.json" });
// 		}
// 	});
// });

app.get("/api/questions", async (req, res) => {
	try {
		const data = await fs.readFile("result.json", "utf-8");
		const questions = JSON.parse(data);
		res.json(questions);
	} catch (err) {
		console.error("Error reading result.json:", err);
		res.status(500).json({ error: "Failed to load questions" });
	}
});
app.listen(3000, () => {
	console.log("Server is listening on port 3000");
});
